import os
import json
import base64
import string
import secrets
import asyncio
import discord
from flask_cors import CORS
from dotenv import load_dotenv
from discord.ext import commands
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import hashlib
import uuid
app = Flask(__name__)
CORS(app)
load_dotenv()
intents = discord.Intents.default()
intents.messages = True
bot = commands.Bot(command_prefix='!', intents=intents)
SIGNUP_CHANNEL_ID = 1302608005744955443
USERS_FILE = 'users.json'
SESSIONS_FILE = 'sessions.json'
MUSIC_FILE = 'music.json'

# PayHere Configuration
PAYHERE_MERCHANT_ID = os.getenv('PAYHERE_MERCHANT_ID', 'YOUR_SANDBOX_MERCHANT_ID')
PAYHERE_MERCHANT_SECRET = os.getenv('PAYHERE_MERCHANT_SECRET', 'YOUR_SANDBOX_MERCHANT_SECRET')
PAYHERE_CHECKOUT_URL = 'https://sandbox.payhere.lk/pay/checkout'  # Use 'https://www.payhere.lk/pay/checkout' for live

# Base URL for frontend return/cancel pages.
APP_BASE_URL = os.getenv('FRONTEND_APP_BASE_URL', 'http://127.0.0.1:5500')

# This must be the public backend.
NOTIFY_URL_BASE = os.getenv('BACKEND_NOTIFY_URL_BASE', 'http://helya.pylex.xyz:10209')

# Functions

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
                        'ProfilePicture': user.get('ProfilePicture', []),
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




# Google Shit




from werkzeug.utils import secure_filename
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = 'credentials.json'
drive_service = build('drive', 'v3', credentials=service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES))
FOLDER_ID = '1XvMPHh57_HxzKwVTeVjhUFUHQ38XWHu0'
USERS_JSON_PATH = 'users.json'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_default_profile_picture():
    with open('./Images/defaultpfp.png', 'rb') as img_file:
        return f"data:image/png;base64,{base64.b64encode(img_file.read()).decode('utf-8')}"

def get_or_create_user_subfolder(email):
    query = f"'{FOLDER_ID}' in parents and name='{email}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    results = drive_service.files().list(q=query, fields="files(id)").execute()
    files = results.get('files', [])
    
    if files:
        return files[0]['id']
    
    # Create subfolder
    file_metadata = {
        'name': email,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [FOLDER_ID]
    }
    folder = drive_service.files().create(body=file_metadata, fields='id').execute()
    return folder['id']

def delete_existing_files(folder_id):
    query = f"'{folder_id}' in parents and trashed=false"
    results = drive_service.files().list(q=query, fields="files(id)").execute()
    for file in results.get('files', []):
        drive_service.files().delete(fileId=file['id']).execute()






# Google Shit

# Profile stuff


@app.route('/register', methods=['POST'])
def newregister():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        birthdate = data.get('birthdate')
        password = data.get('password')
        grade = data.get('grade')

        if not all([username, email, birthdate, password, grade]):
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
            "grade": grade,
            "password": hashed_password,
            "ProfilePicture": get_default_profile_picture(),
            "ProfilePictureFileID": "",
            "credits": 0,
            "createdAt": datetime.utcnow().isoformat()
        }
        
        save_json(USERS_FILE, users)
        print(f"New user registered: {username} ({email}), Grade: {grade}")
        send_embed_to_discord("Registration Successful", f"New user registered: {username} ({email}), Grade: {grade}")

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
        
        hashed_password = user.get('password')
        password_length = len(check_password_hash(hashed_password, 'dummy') * '*') if hashed_password else 0
        
        return jsonify({
            "username": user['username'],
            "email": email,
            "birthday": user['birthdate'],
            "passwordLength": '*' * password_length,
            "ProfilePicture": user.get('ProfilePicture') or get_default_profile_picture(),
        }), 200

    except Exception as e:
        print(f"Error fetching profile: {e}")
        return jsonify({"message": "An error occurred while fetching profile"}), 500

@app.route('/updatepfp', methods=['POST'])
def update_profile_picture():
    try:
        if 'profilePicture' not in request.files or 'email' not in request.form:
            return jsonify({"message": "Missing file or email"}), 400

        file = request.files['profilePicture']
        email = request.form['email']

        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({"message": "Invalid or no file selected"}), 400

        user_folder_id = get_or_create_user_subfolder(email)
        delete_existing_files(user_folder_id)

        filename = secure_filename(file.filename)
        file_metadata = {
            'name': filename,
            'parents': [user_folder_id]
        }
        media = MediaIoBaseUpload(io.BytesIO(file.read()), mimetype=file.mimetype)
        uploaded_file = drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()

        file_id = uploaded_file.get('id')
        file_url = f"https://drive.google.com/uc?id={file_id}"

        user_data = {}
        if os.path.exists(USERS_JSON_PATH):
            with open(USERS_JSON_PATH, 'r') as f:
                user_data = json.load(f)

        if email not in user_data:
            user_data[email] = {}

        user_data[email]["ProfilePicture"] = file_url
        user_data[email]["ProfilePictureFileID"] = file_id
        with open(USERS_JSON_PATH, 'w') as f:
            json.dump(user_data, f, indent=4)

        return jsonify({
            "message": "Profile picture updated successfully",
            "profileImage": file_url
        }), 200

    except Exception as e:
        print(f"Error updating profile picture: {e}")
        return jsonify({"message": "An error occurred while updating profile picture"}), 500

@app.route("/ping", methods=["GET"])
def receive_ping():
    sender_ip = request.remote_addr
    return f"Received ping from {sender_ip}"



# Support, Classes stuff

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
        
    if class_id in user['enrolled_classes']:
        return jsonify({
            "message": "Already enrolled",
            "zoom_link": class_info['zoom_link']
        })
        
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
        
    class_datetime = datetime.strptime(f"{class_info['date']} {class_info['time']}", "%Y-%m-%d %I:%M %p")
    if datetime.now() > class_datetime + timedelta(hours=1, minutes=30):
        return jsonify({"error": "Class has expired"}), 410
        
    return jsonify({"zoom_link": class_info['zoom_link']})











# -------------------- PAYHERE CREDIT PURCHASE INTEGRATION ------------------------

@app.route('/payhere/checkout', methods=['POST'])
def payhere_checkout():
    try:
        data = request.get_json()
        email = data.get('email')
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "Authorization token is missing or malformed"}), 401
        token = auth_header.split(' ')[1]
        
        package_name = data.get('packageName')
        price_str = data.get('price')
        credits_to_add_str = data.get('creditsToAdd')

        if not all([email, token, package_name, price_str, credits_to_add_str]):
            return jsonify({"message": "Missing required fields for payment initiation"}), 400

        if not verify_token(email, token):
            return jsonify({"message": "Invalid or expired session"}), 401

        users = load_json(USERS_FILE)
        user = users.get(email)
        if not user:
            return jsonify({"message": "User not found"}), 404

        try:
            amount = float(price_str)
            credits_to_add = int(credits_to_add_str)
        except ValueError:
            return jsonify({"message": "Invalid price or credits format"}), 400

        order_id = str(uuid.uuid4())
        currency = 'LKR'
        amount_formatted_for_hash = "{:.2f}".format(amount)
        merchant_secret_hashed_upper = hashlib.md5(PAYHERE_MERCHANT_SECRET.encode('utf-8')).hexdigest().upper()
        
        hash_string = "".join([
            PAYHERE_MERCHANT_ID,
            order_id,
            amount_formatted_for_hash,
            currency,
            merchant_secret_hashed_upper
        ])
        final_hash = hashlib.md5(hash_string.encode('utf-8')).hexdigest().upper()

        return_url = f'{APP_BASE_URL}/Purchase/purchase-success.html'
        cancel_url = f'{APP_BASE_URL}/Purchase/purchase-cancelled.html'
        notify_url = f'{NOTIFY_URL_BASE}/payhere/notify'

        user_full_name = user.get('username', 'N/A')
        first_name_val = user_full_name.split(' ')[0] if user_full_name != 'N/A' else 'N/A'
        last_name_val = user_full_name.split(' ')[-1] if ' ' in user_full_name and user_full_name != 'N/A' else 'N/A'
        if first_name_val == last_name_val and first_name_val != 'N/A':
            last_name_val = ''

        payload = {
            "success": True,
            "merchant_id": PAYHERE_MERCHANT_ID,
            "return_url": return_url,
            "cancel_url": cancel_url,
            "notify_url": notify_url,
            "order_id": order_id,
            "items": package_name,
            "currency": currency,
            "amount": amount_formatted_for_hash,
            "first_name": first_name_val,
            "last_name": last_name_val,
            "email": email,
            "phone": "",
            "address": "",
            "city": "",
            "country": "Sri Lanka",
            "hash": final_hash,
            "custom_1": email,
            "custom_2": str(credits_to_add)
        }
        return jsonify(payload), 200
    except Exception as e:
        print(f"Error during PayHere checkout initiation: {e}")
        return jsonify({"message": "An error occurred during payment initiation", "error": str(e)}), 500


@app.route('/payhere/notify', methods=['POST'])
def payhere_notify():
    try:
        data = request.form
        merchant_id = data.get('merchant_id')
        order_id = data.get('order_id')
        payhere_amount = data.get('payhere_amount')
        payhere_currency = data.get('payhere_currency')
        status_code = data.get('status_code')
        md5sig_from_payhere = data.get('md5sig')
        user_email_on_notify = data.get('custom_1')
        credits_to_add_on_notify_str = data.get('custom_2')

        if not all([merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig_from_payhere, user_email_on_notify, credits_to_add_on_notify_str]):
            print(f"PayHere Notify: Missing data in notification. Order ID: {order_id}, Email: {user_email_on_notify}")
            return "Notification Error: Missing Data", 400

        if merchant_id != PAYHERE_MERCHANT_ID:
            print(f"PayHere Notify: Merchant ID mismatch. Order ID: {order_id}")
            return "Notification Error: Merchant ID Mismatch", 400

        merchant_secret_hashed_upper = hashlib.md5(PAYHERE_MERCHANT_SECRET.encode('utf-8')).hexdigest().upper()

        hash_string_for_notify = "".join([
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            merchant_secret_hashed_upper
        ])
        expected_md5sig = hashlib.md5(hash_string_for_notify.encode('utf-8')).hexdigest().upper()

        if expected_md5sig != md5sig_from_payhere:
            print(f"PayHere Notify: MD5 signature mismatch for order {order_id}. Expected: {expected_md5sig}, Got: {md5sig_from_payhere}")
            return "Notification Error: Signature Mismatch", 400 

        if status_code == '2':  # Payment successful
            users = load_json(USERS_FILE)
            user = users.get(user_email_on_notify)
            if user:
                try:
                    credits_to_add = int(credits_to_add_on_notify_str)
                    current_credits = int(user.get('credits', 0))
                    user['credits'] = current_credits + credits_to_add
                    save_json(USERS_FILE, users)
                    print(f"PayHere Notify: Successfully added {credits_to_add} credits to user {user_email_on_notify} for order {order_id}. New balance: {user['credits']}")
                    send_embed_to_discord(
                        "Payment Successful & Credits Updated", 
                        f"User: {user_email_on_notify}\nOrder ID: {order_id}\nAmount: {payhere_amount} {payhere_currency}\nCredits Added: {credits_to_add}\nNew Balance: {user['credits']}"
                    )
                except ValueError:
                    print(f"PayHere Notify: Invalid credits_to_add format '{credits_to_add_on_notify_str}' for user {user_email_on_notify}, order {order_id}")
                except Exception as e_credits:
                    print(f"PayHere Notify: Error updating credits for {user_email_on_notify}, order {order_id}: {e_credits}")
            else:
                print(f"PayHere Notify: User {user_email_on_notify} not found for order {order_id} after successful payment.")
        elif status_code == '0':
            print(f"PayHere Notify: Payment pending for order {order_id}.")
        elif status_code == '-1':
            print(f"PayHere Notify: Payment cancelled for order {order_id}.")
        elif status_code == '-2':
            print(f"PayHere Notify: Payment failed for order {order_id}.")
        elif status_code == '-3':
            print(f"PayHere Notify: Payment chargedback for order {order_id}.")
        else:
            print(f"PayHere Notify: Received unknown status_code {status_code} for order {order_id}.")

        return "OK", 200
    except Exception as e:
        print(f"Error processing PayHere notification: {e}")
        return "Internal Server Error processing notification", 500

# THEBOOK CODE--------------------------------------------------------------------

if not os.path.exists('data'):
    os.makedirs('data')

ADMIN_PASSWORD = "1q2w3e4r"



def init_json_files():
    files = ['restaurants.json', 'reviews.json']
    for file in files:
        path = f'data/{file}'
        if not os.path.exists(path):
            with open(path, 'w') as f:
                json.dump([], f)

init_json_files()


@app.route('/loginbook', methods=['POST'])
def loginbook():
    data = request.json
    if data.get('password') == ADMIN_PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid password"}), 401

@app.route('/restaurants', methods=['GET', 'POST'])
def handle_restaurants():
    if request.method == 'GET':
        with open('data/restaurants.json', 'r') as f:
            return jsonify(json.load(f))
    
    data = request.json
    with open('data/restaurants.json', 'r') as f:
        restaurants = json.load(f)
    
    new_restaurant = {
        "id": str(len(restaurants) + 1),
        "name": data['name'],
        "type": data['type'],
        "products": []
    }
    restaurants.append(new_restaurant)
    
    with open('data/restaurants.json', 'w') as f:
        json.dump(restaurants, f)
    
    return jsonify(new_restaurant)

@app.route('/reviews', methods=['GET', 'POST'])
def handle_reviews():
    if request.method == 'GET':
        restaurant_id = request.args.get('restaurant_id')
        with open('data/reviews.json', 'r') as f:
            reviews = json.load(f)
        if restaurant_id:
            reviews = [r for r in reviews if r['restaurant_id'] == restaurant_id]
        return jsonify(reviews)
    
    data = request.json
    with open('data/reviews.json', 'r') as f:
        reviews = json.load(f)
    
    new_review = {
        "id": str(len(reviews) + 1),
        "restaurant_id": data['restaurant_id'],
        "product_name": data['product_name'],
        "rating": data['rating'],
        "review": data['review'],
        "date": datetime.now().isoformat()
    }
    reviews.append(new_review)
    
    with open('data/reviews.json', 'w') as f:
        json.dump(reviews, f)
    
    return jsonify(new_review)

# THEBOOK CODE--------------------------------------------------------------------

def run_bot():
    bot.run(os.getenv('TOKEN'))

def run_discord_bot():
    loop.create_task(bot.start(DISCORD_TOKEN))

@bot.event
async def on_ready():
    print(f'Bot is ready: {bot.user.name}')

@bot.event
async def on_message(message):
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








# PANEL LOADING ----------------------------

def upload_to_drive(file_data, filename, mime_type):
    try:
        file_metadata = {
            'name': filename,
            'parents': [FOLDER_ID]
        }
        
        media = MediaIoBaseUpload(
            io.BytesIO(file_data),
            mimetype=mime_type,
            resumable=True
        )
        
        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        
        return file.get('webViewLink')
        
    except Exception as e:
        print(f"Drive upload error: {str(e)}")
        raise

def get_user_count():
    users = load_json('users.json')
    return len(users)

def load_data():
    return {
        'users': load_json('users.json'),
        'courses': load_json('courses.json')
    }

def generate_classes():
    today = datetime.datetime.now()
    
    upcoming = [{
        "id": "class1",
        "title": "Derivatives and Applications",
        "course": "Mathematics 101",
        "date": (today + datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
        "startTime": "10:00",
        "endTime": "11:30",
        "duration": 90,
        "room": "Room 101",
        "studentsEnrolled": get_user_count(),
        "description": "Introduction to derivatives and their applications."
    }]
    
    past = [{
        "id": "pastclass1",
        "title": "Introduction to Calculus",
        "course": "Mathematics 101",
        "date": (today - datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
        "startTime": "10:00",
        "endTime": "11:30",
        "duration": 90,
        "room": "Room 101",
        "studentsAttended": get_user_count() - 2,
        "description": "Fundamentals of calculus."
    }]
    
    return {"upcoming": upcoming, "past": past}

def generate_recordings():
    return [{
        "id": "rec1",
        "title": "Introduction to Calculus",
        "course": "Mathematics 101",
        "date": (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
        "duration": "01:30:00",
        "status": "pending",
        "studentsAttended": get_user_count() - 2
    }]

def generate_papers():
    return [{
        "id": "doc1",
        "title": "Calculus Syllabus",
        "type": "syllabus",
        "course": "Mathematics 101",
        "uploadDate": (datetime.datetime.now() - datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
        "size": "256 KB",
        "format": "pdf"
    }]

@app.route('/api/auth/verify', methods=['POST'])
def verify_auth():
    data = request.json
    email = data.get('email')
    token = data.get('token')
    
    users = load_json('users.json')
    if email in users and token == "mock-token":
        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 401

@app.route('/api/teacher/data', methods=['POST'])
def get_teacher_data():
    data = request.json
    email = data.get('email')
    token = data.get('token')
    
    users = load_json('users.json')
    if email not in users or token != "mock-token":
        return jsonify({"status": "error"}), 401
    
    stats = {
        "pendingRecordings": 1,
        "upcomingClasses": 1,
        "papersToGrade": 5,
        "totalStudents": get_user_count()
    }
    
    return jsonify({
        "status": "success",
        "stats": stats,
        "recordings": generate_recordings(),
        "classes": generate_classes(),
        "papers": generate_papers()
    })



@app.route('/confirmteacherloggedin', methods=['POST'])
def confirm_teacher_logged_in():
    data = request.json
    email = data.get('email')
    token = data.get('token')
    
    if not email or not token:
        return jsonify({"message": "Missing credentials"}), 400
        
    if email != 'ssjayasundara@yahoo.com0':
        return jsonify({"message": "Not authorized"}), 401
        
    if not verify_token(email, token):
        return jsonify({"message": "Invalid token"}), 401
        
    return jsonify({"message": "Authorized"}), 200

@app.route('/loadteacher', methods=['POST'])
def load_teacher():
    data = request.json
    email = data.get('email')
    token = data.get('token')
    
    if email != 'ssjayasundara@yahoo.com0':
        return jsonify({"message": "Not authorized"}), 401
        
    if not verify_token(email, token):
        return jsonify({"message": "Unauthorized"}), 401
    
    classes_data = load_json('classes.json')
    recordings_data = load_json('recordings.json')
    papers_data = load_json('papers.json')
    
    # Calculate stats
    pending_recordings = sum(1 for rec in recordings_data['recordings'] 
                           if rec['status'] == 'pending')
    upcoming_classes = sum(1 for cls in classes_data['classes'] 
                         if datetime.strptime(cls['date'], '%Y-%m-%d') > datetime.now())
    
    return jsonify({
        "stats": {
            "pendingRecordings": pending_recordings,
            "upcomingClasses": upcoming_classes,
            "papersToGrade": len(papers_data['papers']),
            "totalStudents": sum(cls['studentsEnrolled'] for cls in classes_data['classes'])
        },
        "recordings": recordings_data['recordings'],
        "classes": {
            "upcoming": [cls for cls in classes_data['classes'] 
                        if datetime.strptime(cls['date'], '%Y-%m-%d') > datetime.now()],
            "past": [cls for cls in classes_data['classes'] 
                    if datetime.strptime(cls['date'], '%Y-%m-%d') <= datetime.now()]
        },
        "papers": papers_data['papers']
    })

@app.route('/upload/recording', methods=['POST'])
def upload_recording():
    email = request.form.get('email')
    token = request.form.get('token')
    
    if email != 'ssjayasundara@yahoo.com0' or not verify_token(email, token):
        return jsonify({"message": "Unauthorized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"message": "No file provided"}), 400
        
    file = request.files['file']
    recording_id = request.form.get('recordingId')
    
    recordings = load_json('recordings.json')
    recording = next((r for r in recordings['recordings'] if r['id'] == recording_id), None)
    
    if not recording:
        return jsonify({"message": "Recording not found"}), 404
    
    try:
        drive_link = upload_to_drive(
            file.read(),
            f"recording_{recording_id}_{file.filename}",
            file.content_type
        )
        
        recording['status'] = 'uploaded'
        recording['driveLink'] = drive_link
        save_json('recordings.json', recordings)
        
        return jsonify({
            "message": "Recording uploaded successfully",
            "driveLink": drive_link
        })
        
    except Exception as e:
        return jsonify({"message": f"Upload failed: {str(e)}"}), 500

@app.route('/upload/paper', methods=['POST'])
def upload_paper():
    email = request.form.get('email')
    token = request.form.get('token')
    
    if email != 'ssjayasundara@yahoo.com0' or not verify_token(email, token):
        return jsonify({"message": "Unauthorized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"message": "No file provided"}), 400
        
    file = request.files['file']
    paper_data = json.loads(request.form.get('data'))
    
    papers = load_json('papers.json')
    
    try:
        drive_link = upload_to_drive(
            file.read(),
            f"paper_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}",
            file.content_type
        )
        
        new_paper = {
            "id": f"doc{len(papers['papers']) + 1}",
            "title": paper_data['title'],
            "type": paper_data['type'],
            "course": paper_data['course'],
            "uploadDate": datetime.now().strftime('%Y-%m-%d'),
            "size": f"{len(file.read()) / 1024:.0f} KB",
            "format": file.filename.split('.')[-1].lower(),
            "driveLink": drive_link
        }
        
        papers['papers'].append(new_paper)
        save_json('papers.json', papers)
        
        return jsonify({
            "message": "Paper uploaded successfully",
            "paper": new_paper
        })
        
    except Exception as e:
        return jsonify({"message": f"Upload failed: {str(e)}"}), 500



# PANEL LOADING ----------------------------



if __name__ == '__main__':



    os.makedirs('sirdata', exist_ok=True)
    
    if not os.path.exists('data/users.json'):
        initial_users = {
            "teacher@example.com": {
                "id": "1",
                "email": "teacher@example.com",
                "name": "John Doe"
            }
        }
        save_json(initial_users, 'users.json')
    
    # Initialize courses.json if it doesn't exist
    if not os.path.exists('data/courses.json'):
        initial_courses = {
            "1": {
                "id": "1",
                "teacher_id": "1",
                "title": "Mathematics 101",
                "description": "Introduction to Calculus"
            },
            "2": {
                "id": "2",
                "teacher_id": "1",
                "title": "Physics 201",
                "description": "Classical Mechanics"
            }
        }
        save_json(initial_courses, 'courses.json')

    import threading
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    run_discord_bot()
    app.run(host='0.0.0.0', port=10209)
