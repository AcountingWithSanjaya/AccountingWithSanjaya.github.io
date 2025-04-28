import os
import json
import string
import secrets
import asyncio
import discord
from flask_cors import CORS
from dotenv import load_dotenv
from discord.ext import commands
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
app = Flask(__name__)
CORS(app)
load_dotenv()
intents = discord.Intents.default()
intents.messages = True
bot = commands.Bot(command_prefix='!', intents=intents)


SIGNUP_CHANNEL_ID = 1333091359405379746
USERS_FILE = 'users.json'
SESSIONS_FILE = 'sessions.json'
MUSIC_FILE = 'music.json'

def load_json(file):
    try:
        with open(file, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                converted_data = {}
                for user in data:
                    converted_data[user['email']] = {
                        'username': user['username'],
                        'birthdate': user['birthdate'],
                        'password': user['password'],
                        'boughtMusic': user.get('boughtMusic', []),
                        'publishedMusic': user.get('publishedMusic', [])
                    }
                save_json(file, converted_data)  
                return converted_data
            return data if isinstance(data, dict) else {}
    except (FileNotFoundError, json.JSONDecodeError):
        save_json(file, {})
        return {}

def save_json(file, data):
    with open(file, 'w') as f:
        json.dump(data, f, indent=4)

def find_user_by_username_or_email(identifier, users):
    if identifier in users:
        return identifier, users[identifier]
    
    for email, user_data in users.items():
        if user_data['username'].lower() == identifier.lower():
            return email, user_data
    return None, None

def send_embed_to_discord(title, message):
    channel = bot.get_channel(SIGNUP_CHANNEL_ID)
    if channel:
        embed = discord.Embed(title=title, color=discord.Color.green())
        embed.add_field(name="Details", value=message, inline=False)
        embed.set_footer(text="User Registration System")
        bot.loop.create_task(channel.send(embed=embed))

def generate_token():
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(64))

def cleanup_sessions():
    sessions = load_json(SESSIONS_FILE)
    current_time = datetime.now()
    sessions = {
        email: data for email, data in sessions.items()
        if datetime.fromisoformat(data['created_at']) + timedelta(hours=720) > current_time
    }
    save_json(SESSIONS_FILE, sessions)

def verify_token(email, token):
    sessions = load_json(SESSIONS_FILE)
    
    session = sessions.get(email)
    
    if not session or session['token'] != token:
        return False
        
    session_time = datetime.fromisoformat(session['created_at'])
    if datetime.now() - session_time > timedelta(hours=24):
        del sessions[email]
        save_json(SESSIONS_FILE, sessions)
        return False
        
    return True

def load_classes():
    try:
        with open('classes.json', 'r') as file:
            data = json.load(file)
            return data['classes'][:3]
    except Exception as e:
        print(f"Error loading classes: {e}")
        return []

def load_users():
    try:
        with open('users.json', 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading users: {e}")
        return {"users": []}

def save_users(users_data):
    try:
        with open('users.json', 'w') as file:
            json.dump(users_data, file, indent=4)
    except Exception as e:
        print(f"Error saving users: {e}")

@app.route('/api/classes', methods=['GET'])
def get_classes():
    classes = load_classes()
    return jsonify(classes)

@app.route('/api/user/credits', methods=['GET'])
def get_user_credits():
    email = request.args.get('email')
    token = request.headers.get('Authorization')
    
    if not email or not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    users_data = load_users()
    user = next((user for user in users_data['users'] if user['email'] == email), None)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"credits": user['credits']})

@app.route('/api/class/join', methods=['POST'])
def join_class():
    data = request.json
    email = data.get('email')
    class_id = data.get('classId')
    token = request.headers.get('Authorization')
    
    if not email or not token or not class_id:
        return jsonify({"error": "Invalid request"}), 400
        
    users_data = load_users()
    classes = load_classes()
    
    user = next((user for user in users_data['users'] if user['email'] == email), None)
    class_info = next((c for c in classes if c['id'] == class_id), None)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not class_info:
        return jsonify({"error": "Class not found"}), 404
    if user['credits'] <= 0:
        return jsonify({"error": "Insufficient credits"}), 400
        
    # Check if class is already enrolled
    if class_id in user['enrolled_classes']:
        return jsonify({
            "message": "Already enrolled",
            "zoom_link": class_info['zoom_link']
        })
        
    # Update user credits and enrolled classes
    user['credits'] -= 1
    user['enrolled_classes'].append(class_id)
    save_users(users_data)
    
    return jsonify({
        "message": "Successfully enrolled",
        "zoom_link": class_info['zoom_link'],
        "remaining_credits": user['credits']
    })

@app.route('/api/class/zoom-link', methods=['GET'])
def get_zoom_link():
    email = request.args.get('email')
    class_id = int(request.args.get('classId'))
    token = request.headers.get('Authorization')
    
    if not email or not token or not class_id:
        return jsonify({"error": "Invalid request"}), 400
        
    users_data = load_users()
    classes = load_classes()
    
    user = next((user for user in users_data['users'] if user['email'] == email), None)
    class_info = next((c for c in classes if c['id'] == class_id), None)
    
    if not user or not class_info:
        return jsonify({"error": "Not found"}), 404
        
    if class_id not in user['enrolled_classes']:
        return jsonify({"error": "Not enrolled in this class"}), 403
        
    # Check if class has expired
    class_datetime = datetime.strptime(f"{class_info['date']} {class_info['time']}", "%Y-%m-%d %I:%M %p")
    if datetime.now() > class_datetime + timedelta(hours=1, minutes=30):
        return jsonify({"error": "Class has expired"}), 410
        
    return jsonify({"zoom_link": class_info['zoom_link']})




@app.route('/register', methods=['POST'])
def submit_form():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        birthdate = data.get('birthdate')
        password = data.get('password')

        if not all([username, email, birthdate, password]):
            send_embed_to_discord("Registration Failed", f"Missing fields for email: {email}")
            return jsonify({"message": "All fields are required"}), 400

        users = load_json(USERS_FILE)
        
        if email in users:
            send_embed_to_discord("Registration Failed", f"Email already exists: {email}")
            return jsonify({"message": "User with this email already exists"}), 409
            
        for existing_user in users.values():
            if existing_user['username'].lower() == username.lower():
                send_embed_to_discord("Registration Failed", f"Username already exists: {username}")
                return jsonify({"message": "Username already taken"}), 409

        hashed_password = generate_password_hash(password)
        users[email] = {
            "username": username,
            "birthdate": birthdate,
            "password": hashed_password,
            "boughtMusic": [],
            "publishedMusic": []
        }

        save_json(USERS_FILE, users)
        print(f"New user registered: {username} ({email})")
        send_embed_to_discord("Registration Successful", f"New user registered: {username} ({email})")

        return jsonify({"message": "Registration successful!"}), 200

    except Exception as e:
        print(f"Error during registration: {e}")
        send_embed_to_discord("Registration Error", f"Error occurred while processing registration: {e}")
        return jsonify({"message": "An error occurred during registration"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        identifier = data.get('email') 
        password = data.get('password')

        if not identifier or not password:
            return jsonify({"message": "Email/username and password are required"}), 400

        users = load_json(USERS_FILE)
        email, user = find_user_by_username_or_email(identifier, users)

        if not user or not check_password_hash(user["password"], password):
            return jsonify({"message": "Invalid username/email or password"}), 401

        cleanup_sessions()

        token = generate_token()
        sessions = load_json(SESSIONS_FILE)
        sessions[email] = {
            'token': token,
            'created_at': datetime.now().isoformat()
        }
        save_json(SESSIONS_FILE, sessions)

        return jsonify({
            "message": "Login successful!",
            "token": token,
            "username": user['username'],
            "email": email
        }), 200

    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({"message": "An error occurred during login"}), 500

@app.route('/confirmloggedin', methods=['POST'])
def confirm_logged_in():
    try:
        data = request.get_json()
        email = data.get('email')
        token = data.get('token')

        if not email or not token:
            return jsonify({"message": "Email and token are required"}), 400

        if not verify_token(email, token):
            return jsonify({"message": "Invalid or expired session"}), 401

        return jsonify({"message": "User is logged in"}), 200

    except Exception as e:
        print(f"Error during session verification: {e}")
        return jsonify({"message": "An error occurred while confirming login"}), 500

@app.route('/profile', methods=['GET'])
def get_profile():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
            
        token = auth_header.split(' ')[1]
        email = request.args.get('email') or request.headers.get('X-User-Email')
        
        if not email:
            return jsonify({"message": "No email provided"}), 401
            
        if not verify_token(email, token):
            return jsonify({"message": "Invalid or expired token"}), 401
            
        users = load_json(USERS_FILE)
        user = users.get(email)
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        # Extract and mask password length properly
        hashed_password = user.get('password')
        password_length = len(check_password_hash(hashed_password, 'dummy') * '*') if hashed_password else 0
        
        return jsonify({
            "username": user['username'],
            "email": email,
            "birthday": user['birthdate'],
            "passwordLength": '*' * password_length,
            "boughtMusic": user.get('boughtMusic', []),
            "publishedMusic": user.get('publishedMusic', [])
        }), 200

    except Exception as e:
        print(f"Error fetching profile: {e}")
        return jsonify({"message": "An error occurred while fetching profile"}), 500

@app.route("/ping", methods=["GET"])
def receive_ping():
    sender_ip = request.remote_addr
    return f"Received ping from {sender_ip}"

DISCORD_TOKEN = os.getenv("TOKEN")
TARGET_USER_ID = 795492792176082944
loop = asyncio.get_event_loop()

@app.route('/SupportForm', methods=['POST'])
def handle_form():
    data = request.json

    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')

    if not all([name, email, subject, message]):
        return jsonify({'message': 'All fields are required'}), 400

    msg = (
        f"📨 **New Support Message**\n\n"
        f"**Name:** {name}\n"
        f"**Email:** {email}\n"
        f"**Subject:** {subject}\n"
        f"**Message:** {message}"
    )

    async def send_dm():
        await bot.wait_until_ready()
        user = await bot.fetch_user(TARGET_USER_ID)
        if user:
            await user.send(msg)

    try:
        loop.create_task(send_dm())
        return jsonify({'message': 'Support message sent on Discord!'}), 200
    except Exception as e:
        return jsonify({'message': f'Error sending message: {str(e)}'}), 500


def run_discord_bot():
    loop.create_task(bot.start(DISCORD_TOKEN))


CLASSES_FILE = 'classes.json'
ALLOWED_USERS = os.getenv('ALLOWED_USERS', '').split(',')

def load_classes():
    try:
        with open(CLASSES_FILE, 'r') as f:
            return json.load(f)['classes']
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_classes(classes):
    with open(CLASSES_FILE, 'w') as f:
        json.dump({'classes': classes}, f, indent=2)

@app.route('/schedule')
def get_schedule():
    try:
        classes = load_classes()
        return jsonify(classes)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch classes'}), 500

@bot.event
async def on_ready():
    print(f'Bot is ready: {bot.user.name}')

@bot.event
async def on_message(message):
    # Only respond to DMs from allowed users
    if not message.guild and str(message.author.id) in ALLOWED_USERS:
        args = [arg.strip() for arg in message.content.split('|')]
        
        if args[0] == '!addclass':
            if len(args) != 4:
                await message.reply('Usage: !addclass | topic | YYYY-MM-DD | HH:MM-HH:MM')
                return

            _, topic, date, time_range = args
            start_time, end_time = time_range.split('-')

            try:
                start_datetime = datetime.strptime(f'{date} {start_time}', '%Y-%m-%d %H:%M')
                end_datetime = datetime.strptime(f'{date} {end_time}', '%Y-%m-%d %H:%M')

                new_class = {
                    'id': str(int(datetime.now().timestamp() * 1000)),
                    'title': topic,
                    'startTime': start_datetime.isoformat(),
                    'endTime': end_datetime.isoformat()
                }

                classes = load_classes()
                classes.append(new_class)
                save_classes(classes)

                await message.reply('Class added successfully!')
            except ValueError:
                await message.reply('Invalid date or time format. Please use YYYY-MM-DD for date and HH:MM for time.')

    await bot.process_commands(message)

def run_bot():
    bot.run(os.getenv('DISCORD_TOKEN'))

if __name__ == '__main__':
    import threading
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    run_discord_bot()
    app.run(host='0.0.0.0', port=11219)