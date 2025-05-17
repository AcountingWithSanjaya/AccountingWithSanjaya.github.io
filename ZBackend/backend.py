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
USERS_FILE = 'users.json' # Assuming this is in ZBackend/
SESSIONS_FILE = 'sessions.json' # Assuming this is in ZBackend/
CLASSES_FILE = 'classes.json' # Assuming this is in ZBackend/
PAPERS_FILE = 'papers.json' # Assuming this is in ZBackend/
RECORDINGS_FILE = 'recordings.json' # Assuming this is in ZBackend/
COURSES_FILE = 'courses.json' # Assuming this is in ZBackend/
# MUSIC_FILE = 'music.json' # Not used in this request

TEACHER_EMAILS = ['ssjayasundara@yahoo.com', 'omareeto2012@hotmail.com']

# PayHere Configuration
PAYHERE_MERCHANT_ID = os.getenv('PAYHERE_MERCHANT_ID', 'YOUR_SANDBOX_MERCHANT_ID')
PAYHERE_MERCHANT_SECRET = os.getenv('PAYHERE_MERCHANT_SECRET', 'YOUR_SANDBOX_MERCHANT_SECRET')
PAYHERE_CHECKOUT_URL = 'https://sandbox.payhere.lk/pay/checkout'  # Use 'https://www.payhere.lk/pay/checkout' for live

# Base URL for frontend return/cancel pages.
APP_BASE_URL = os.getenv('FRONTEND_APP_BASE_URL', 'http://127.0.0.1:5500')

# This must be the public backend.
NOTIFY_URL_BASE = os.getenv('BACKEND_NOTIFY_URL_BASE', 'http://127.0.0.1:10209')

# Functions

def load_json(file):
    try:
        with open(file, 'r') as f:
            # For users.json, ensure it's a dict keyed by email.
            # For other files like classes.json, papers.json, recordings.json, they might have a root key (e.g., "classes": [...])
            data = json.load(f)
            if file == USERS_FILE:
                if isinstance(data, list): # Old format conversion
                    converted_data = {}
                    for user_entry in data:
                        if 'email' in user_entry:
                            converted_data[user_entry['email']] = user_entry
                    save_json(file, converted_data)
                    return converted_data
                return data if isinstance(data, dict) else {}
            return data # For other JSON files, return as is
    except (FileNotFoundError, json.JSONDecodeError):
        if file == USERS_FILE:
            save_json(file, {})
            return {}
        # For other files, it might be appropriate to return a default structure
        if file == CLASSES_FILE: return {"classes": []}
        if file == PAPERS_FILE: return {"papers": []}
        if file == RECORDINGS_FILE: return {"recordings": []}
        if file == COURSES_FILE: return {"courses": []} # Added for courses.json
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
    sessions_data = load_json(SESSIONS_FILE)
    current_time = datetime.now()
    cleaned_sessions_data = {}

    for email, user_session_info in sessions_data.items():
        if isinstance(user_session_info, dict) and "active_tokens" in user_session_info:
            still_valid_tokens = [
                s_token_info for s_token_info in user_session_info["active_tokens"]
                if 'expires_at' in s_token_info and datetime.fromisoformat(s_token_info['expires_at']) > current_time
            ]
            if still_valid_tokens: # Only keep user entry if they have any valid tokens left
                cleaned_sessions_data[email] = {"active_tokens": still_valid_tokens}
        # Old format tokens (without expires_at) or malformed entries will be pruned.
    
    save_json(SESSIONS_FILE, cleaned_sessions_data)

def verify_token(email, token):
    sessions_data = load_json(SESSIONS_FILE)
    user_session_info = sessions_data.get(email)

    if not user_session_info or not isinstance(user_session_info, dict) or "active_tokens" not in user_session_info:
        return False # User has no sessions or session data is malformed

    active_tokens = user_session_info.get("active_tokens", [])
    token_to_verify_is_valid = False
    
    updated_tokens_for_user = []
    token_to_verify_is_valid = False # Flag to indicate if the token being verified is itself valid
    
    found_token_to_verify = False
    for session_token_info in active_tokens:
        if session_token_info['token'] == token:
            found_token_to_verify = True
            # Check expiry for the token being verified
            if 'expires_at' in session_token_info and datetime.now() < datetime.fromisoformat(session_token_info['expires_at']):
                updated_tokens_for_user.append(session_token_info) # Keep it, it's valid
                token_to_verify_is_valid = True
            # If expired or no expires_at, it's not added, thus removed.
            break # Found the token, no need to check further for this specific token

    if not found_token_to_verify:
        return False # The token to verify was not in the list at all.

    if not token_to_verify_is_valid:
        # If the token being verified was found but was expired, we still need to clean up other tokens
        # and save, but this specific verification fails.
        pass # Proceed to save potentially cleaned list, but return False for this token

    # Rebuild the list of tokens, excluding any other expired ones (not just the one being verified)
    # This handles the case where verify_token is called and cleans up other expired tokens simultaneously.
    # However, if the token_to_verify itself was valid, it's already in updated_tokens_for_user.
    # If it was invalid, it's not. We need to ensure other valid tokens are preserved.
    
    final_active_tokens = []
    for s_token_info in active_tokens:
        if 'expires_at' in s_token_info and datetime.now() < datetime.fromisoformat(s_token_info['expires_at']):
            if s_token_info['token'] == token and token_to_verify_is_valid: # If it's the one we verified and it was good
                 if not any(t['token'] == s_token_info['token'] for t in final_active_tokens): # Avoid double adding
                    final_active_tokens.append(s_token_info)
            elif s_token_info['token'] != token: # Preserve other valid tokens
                 if not any(t['token'] == s_token_info['token'] for t in final_active_tokens):
                    final_active_tokens.append(s_token_info)
            # If s_token_info['token'] == token but token_to_verify_is_valid is False, it's skipped (expired)

    if not final_active_tokens:
        # If all tokens (including the one being verified or others) were expired or removed
        if email in sessions_data:
            del sessions_data[email]
    else:
        sessions_data[email]["active_tokens"] = final_active_tokens # Correctly save the list of all valid tokens
    
    save_json(SESSIONS_FILE, sessions_data)
    
    return token_to_verify_is_valid

def load_classes():
    # This function seems to load only 3 classes, which might not be what's always intended.
    # Replacing its usage with load_all_classes_from_file or load_json(CLASSES_FILE)
    # For now, commenting out as it's not used directly by the refactored parts.
    # try:
    #     with open('classes.json', 'r') as file:
    #         data = json.load(file)
    #         return data['classes'][:3] # This [:3] was specific
    # except Exception as e:
    #     print(f"Error loading classes: {e}")
    #     return []
    pass


# Google Shit




from werkzeug.utils import secure_filename
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = 'credentials.json'
drive_service = None
try:
    drive_service = build('drive', 'v3', credentials=service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES))
except Exception as e:
    print(f"WARNING: Failed to initialize Google Drive service: {e}. Google Drive features will be disabled.")
FOLDER_ID = '1XvMPHh57_HxzKwVTeVjhUFUHQ38XWHu0' # Ensure this is defined even if drive_service fails, though it might not be usable.
USERS_JSON_PATH = 'users.json'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_default_profile_picture():
    # Adjusted path assuming backend.py is in ZBackend
    try:
        with open('../Images/defaultpfp.png', 'rb') as img_file:
            return f"data:image/png;base64,{base64.b64encode(img_file.read()).decode('utf-8')}"
    except FileNotFoundError:
        print("Default profile picture not found at ../Images/defaultpfp.png")
        return "" # Return empty or a placeholder if not found

def get_or_create_user_subfolder(email):
    if drive_service is None:
        print("WARNING: Google Drive service not available, cannot get or create user subfolder.")
        return None # Or raise an error, depending on desired behavior
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
    if drive_service is None:
        print("WARNING: Google Drive service not available, cannot delete existing files.")
        return
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
            "birthdate": birthdate,
            "grade": grade,
            "password": hashed_password,
            "profileImage": get_default_profile_picture(), # Changed key for consistency
            "profileImageFileID": "", # Changed key
            "credits": 0,
            "enrolled_classes": [], # Initialize enrolled_classes
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
        identifier = data.get('email') # This field is named 'email' in frontend request
        password = data.get('password')
        remember_me = data.get('rememberMe', False) # Get rememberMe flag, default to False

        if not identifier or not password:
            return jsonify({"message": "Email/username and password are required"}), 400

        users = load_json(USERS_FILE)
        email, user = find_user_by_username_or_email(identifier, users)

        if not user or not check_password_hash(user["password"], password):
            return jsonify({"message": "Invalid username/email or password"}), 401

        cleanup_sessions() # General cleanup can be run periodically or here

        new_token = generate_token()
        sessions_data = load_json(SESSIONS_FILE)

        # Ensure the user's entry is in the new format
        if email not in sessions_data or not isinstance(sessions_data.get(email), dict) or "active_tokens" not in sessions_data.get(email, {}):
            sessions_data[email] = {"active_tokens": []}
        
        # Ensure active_tokens is a list (it should be if previous check passed, but defensive)
        if not isinstance(sessions_data[email].get("active_tokens"), list):
            sessions_data[email]["active_tokens"] = []
        
        # Determine token expiry
        created_at_dt = datetime.now()
        if remember_me:
            expiry_duration = timedelta(days=30)
        else:
            expiry_duration = timedelta(hours=24)
        expires_at_dt = created_at_dt + expiry_duration

        sessions_data[email]["active_tokens"].append({
            'token': new_token,
            'created_at': created_at_dt.isoformat(),
            'expires_at': expires_at_dt.isoformat() 
            # Optionally, add device info here: 'device_info': request.headers.get('User-Agent')
        })
        save_json(SESSIONS_FILE, sessions_data)

        return jsonify({
            "message": "Login successful!",
            "token": new_token, # Return the new token for this session
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
        
        # Ensure keys match what frontend profile.js expects
        profile_data = {
            "username": user.get('username'),
            "fullName": user.get('username'), # Assuming username is fullname
            "email": email,
            "birthdate": user.get('birthdate'),
            "grade": user.get('grade'),
            "credits": user.get('credits', 0),
            "profileImage": user.get('profileImage') or user.get('ProfilePicture') or get_default_profile_picture(),
            # "passwordLength": len(user.get('password', '')) # Avoid sending password info
        }
        return jsonify(profile_data), 200

    except Exception as e:
        print(f"Error fetching profile: {e}")
        return jsonify({"message": "An error occurred while fetching profile"}), 500

@app.route('/updatepfp', methods=['POST'])
def update_profile_picture():
    try:
        email = request.form.get('email')
        token = request.form.get('token')
        file = request.files.get('profilePicture')

        if not email or not token:
            return jsonify({"message": "Authentication details (email or token) missing"}), 400
        
        if not verify_token(email, token):
            return jsonify({"message": "Invalid or expired session. Please log in again."}), 401

        if drive_service is None:
            print("WARNING: update_profile_picture - Google Drive service not configured.")
            return jsonify({"message": "Profile picture update service is currently unavailable. Please try again later."}), 503

        if not file:
            return jsonify({"message": "No profile picture file provided."}), 400
            
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({"message": "Invalid file type or no file selected."}), 400

        user_folder_id = get_or_create_user_subfolder(email)
        if user_folder_id is None: # Check if subfolder creation/retrieval failed (e.g. GDrive issue)
            return jsonify({"message": "Could not access user's storage for profile picture."}), 500
            
        delete_existing_files(user_folder_id)

        filename = secure_filename(file.filename)
        file_metadata = {
            'name': filename,
            'parents': [user_folder_id]
        }
        media = MediaIoBaseUpload(io.BytesIO(file.read()), mimetype=file.mimetype)
        uploaded_file = drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()

        file_id = uploaded_file.get('id')
        # Use a more direct embedding-friendly URL format for Google Drive images
        file_url = f"https://drive.google.com/uc?export=view&id={file_id}"

        user_data = {}
        if os.path.exists(USERS_JSON_PATH):
            with open(USERS_JSON_PATH, 'r') as f:
                user_data = json.load(f)

        if email not in user_data:
            user_data[email] = {}

        users = load_json(USERS_FILE) # Use consistent load_json

        if email not in users:
            return jsonify({"message": "User not found"}), 404

        users[email]["profileImage"] = file_url
        users[email]["profileImageFileID"] = file_id
        
        save_json(USERS_FILE, users) # Use consistent save_json

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

@app.route('/logout', methods=['POST'])
def logout():
    try:
        data = request.get_json()
        email = data.get('email')
        token_to_logout = data.get('token')

        if not email or not token_to_logout:
            return jsonify({"message": "Email and token are required"}), 400

        sessions_data = load_json(SESSIONS_FILE)
        user_session_info = sessions_data.get(email)

        if not user_session_info or not isinstance(user_session_info, dict) or "active_tokens" not in user_session_info:
            # User not found or no active sessions, effectively logged out
            return jsonify({"message": "Logout successful or session not found"}), 200

        active_tokens = user_session_info.get("active_tokens", [])
        
        # Filter out the token to be logged out
        updated_tokens = [s for s in active_tokens if s['token'] != token_to_logout]

        if len(updated_tokens) == len(active_tokens):
            # Token was not found, could mean already logged out or invalid token.
            # Consider this a success from client's perspective.
            pass

        if not updated_tokens:
            # If no tokens are left, remove the user's entry from sessions
            if email in sessions_data:
                del sessions_data[email]
        else:
            sessions_data[email]["active_tokens"] = updated_tokens
            
        save_json(SESSIONS_FILE, sessions_data)
        
        # Clear client-side session cookies if any were set by HttpOnly, though current app uses localStorage
        # response = jsonify({"message": "Logout successful"})
        # response.set_cookie('session_token', '', expires=0) # Example if using cookies
        return jsonify({"message": "Logout successful"}), 200

    except Exception as e:
        print(f"Error during logout: {e}")
        return jsonify({"message": "An error occurred during logout"}), 500


# Support, Classes stuff

DISCORD_TOKEN = os.getenv("TOKEN")
TARGET_USER_ID = 795492792176082944
ALLOWED_USERS = os.getenv('ALLOWED_USERS', '').split(',') # For bot commands
loop = asyncio.get_event_loop()

@app.route('/update-profile', methods=['POST'])
def update_profile():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "Authorization token is missing or malformed"}), 401
        
        token = auth_header.split(' ')[1]
        data = request.get_json()
        email = data.get('email') # Email should be sent by client for verification
        
        new_username = data.get('username')
        new_grade = data.get('grade')
        # new_birthdate = data.get('birthdate') # If making birthdate editable

        if not email:
            return jsonify({"message": "Email is required for profile update"}), 400

        if not verify_token(email, token):
            return jsonify({"message": "Invalid or expired session. Please log in again."}), 401

        if not new_username or not new_grade:
            return jsonify({"message": "Username and Grade cannot be empty"}), 400
        
        # Basic validation for grade format (e.g., "Grade X")
        if not isinstance(new_grade, str) or not new_grade.lower().startswith('grade ') or len(new_grade.split()) < 2:
            return jsonify({"message": "Invalid grade format. Expected format: 'Grade X' (e.g., Grade 10)"}), 400


        users = load_json(USERS_FILE)
        if email not in users:
            return jsonify({"message": "User not found"}), 404

        # Check if new username is already taken by another user (excluding self)
        for user_email, user_data in users.items():
            if user_email != email and user_data.get('username', '').lower() == new_username.lower():
                return jsonify({"message": "Username already taken by another user"}), 409
        
        users[email]['username'] = new_username
        users[email]['grade'] = new_grade
        # if new_birthdate: users[email]['birthdate'] = new_birthdate # If making birthdate editable
        
        save_json(USERS_FILE, users)
        
        send_embed_to_discord("Profile Updated", f"User profile updated for: {email}\nNew Username: {new_username}\nNew Grade: {new_grade}")
        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        print(f"Error updating profile: {e}")
        return jsonify({"message": "An error occurred while updating profile"}), 500


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


# Assuming CLASSES_FILE is defined at the top of the file

def load_all_classes_from_file():
    data = load_json(CLASSES_FILE)
    return data.get('classes', [])

def save_all_classes_to_file(classes_list):
    save_json(CLASSES_FILE, {'classes': classes_list})

@app.route('/schedule', methods=['GET']) # For schedule.html
def get_schedule():
    try:
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1] if auth_header and auth_header.startswith('Bearer ') else None
        email = request.args.get('email') or request.headers.get('X-User-Email')

        if not email or not token or not verify_token(email, token):
            return jsonify({"message": "Unauthorized"}), 401
            
        all_classes = load_all_classes_from_file()
        
        # Filter for upcoming week (next 7 days)
        today = datetime.now().date()
        one_week_later = today + timedelta(days=7)
        
        weekly_schedule = []
        for cls in all_classes:
            try:
                class_date = datetime.strptime(cls.get('date'), "%Y-%m-%d").date()
                if today <= class_date < one_week_later:
                    weekly_schedule.append(cls)
            except (ValueError, TypeError):
                # Skip classes with invalid date format or missing date
                continue
        
        return jsonify(sorted(weekly_schedule, key=lambda x: (x.get('date', ''), x.get('time', ''))))
    except Exception as e:
        print(f"Error fetching schedule: {e}")
        return jsonify({'error': 'Failed to fetch schedule'}), 500

@app.route('/api/classes', methods=['GET']) # For classes.html (My Classes)
def get_classes_for_user_grade():
    try:
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1] if auth_header and auth_header.startswith('Bearer ') else None
        email = request.args.get('email') or request.headers.get('X-User-Email')

        if not email or not token or not verify_token(email, token):
            return jsonify({"message": "Unauthorized"}), 401

        users = load_json(USERS_FILE)
        user = users.get(email)
        if not user or 'grade' not in user:
            return jsonify({"message": "User grade not found"}), 404

        user_grade = user['grade']
        all_classes = load_all_classes_from_file()
        
        # Filter classes by user's grade and ensure they are upcoming
        today_str = datetime.now().strftime("%Y-%m-%d")
        grade_classes = [
            cls for cls in all_classes 
            if cls.get('grade') == user_grade and cls.get('date', '0000-00-00') >= today_str
        ]
        
        return jsonify(sorted(grade_classes, key=lambda x: (x.get('date', ''), x.get('time', ''))))
    except Exception as e:
        print(f"Error fetching classes by grade: {e}")
        return jsonify({'error': 'Failed to fetch classes for your grade'}), 500

@app.route('/api/user/credits', methods=['GET'])
def get_user_credits():
    email = request.args.get('email')
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1] if auth_header and auth_header.startswith('Bearer ') else None
    
    if not email or not token or not verify_token(email, token): # Added token verification
        return jsonify({"error": "Unauthorized"}), 401
    
    users = load_json(USERS_FILE) # Use consistent load_json
    user = users.get(email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"credits": user.get('credits', 0)})

@app.route('/api/class/join', methods=['POST'])
def join_class():
    data = request.json
    email = data.get('email')
    class_id_str = data.get('classId') # classId is string like "c1"
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1] if auth_header and auth_header.startswith('Bearer ') else None
    
    if not email or not token or not class_id_str or not verify_token(email, token):
        return jsonify({"error": "Invalid request or unauthorized"}), 400
        
    users = load_json(USERS_FILE)
    all_classes = load_all_classes_from_file()
    
    user = users.get(email)
    class_info = next((c for c in all_classes if c.get('id') == class_id_str), None)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not class_info:
        return jsonify({"error": "Class not found"}), 404
    
    if user.get('credits', 0) <= 0:
        return jsonify({"error": "Insufficient credits"}), 400
    
    if 'enrolled_classes' not in user:
        user['enrolled_classes'] = []
        
    if class_id_str in user['enrolled_classes']:
        return jsonify({
            "message": "Already enrolled",
            "zoom_link": class_info.get('zoomLink'),
            "remaining_credits": user.get('credits',0)
        })
        
    user['credits'] = user.get('credits', 0) - 1
    user['enrolled_classes'].append(class_id_str)
    save_json(USERS_FILE, users)
    
    return jsonify({
        "message": "Successfully enrolled",
        "zoom_link": class_info.get('zoomLink'),
        "remaining_credits": user.get('credits')
    })

@app.route('/api/class/zoom-link', methods=['GET'])
def get_zoom_link():
    email = request.args.get('email')
    class_id_str = request.args.get('classId') # classId is string
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1] if auth_header and auth_header.startswith('Bearer ') else None
    
    if not email or not token or not class_id_str or not verify_token(email, token):
        return jsonify({"error": "Invalid request or unauthorized"}), 400
        
    users = load_json(USERS_FILE)
    all_classes = load_all_classes_from_file()
    
    user = users.get(email)
    class_info = next((c for c in all_classes if c.get('id') == class_id_str), None)
    
    if not user or not class_info:
        return jsonify({"error": "User or Class not found"}), 404
        
    if class_id_str not in user.get('enrolled_classes', []):
        return jsonify({"error": "Not enrolled in this class"}), 403
    
    # Check if class is within 30 mins of starting or has started (up to 1.5 hours after start)
    try:
        class_datetime_str = f"{class_info.get('date')} {class_info.get('time')}"
        # Handle potential AM/PM format if present, otherwise assume 24-hour
        time_format = "%Y-%m-%d %H:%M"
        if "AM" in class_datetime_str.upper() or "PM" in class_datetime_str.upper():
            time_format = "%Y-%m-%d %I:%M %p" # Example: 2023-10-05 02:30 PM
        
        class_start_time = datetime.strptime(class_datetime_str, time_format)
        now = datetime.now()
        
        # Allow access 30 mins before and up to, say, 2 hours after start (typical class duration)
        if not (class_start_time - timedelta(minutes=30) <= now <= class_start_time + timedelta(hours=2)):
             return jsonify({"error": "Class link is not active yet or has expired."}), 403 # Forbidden to access yet/anymore

    except ValueError:
        return jsonify({"error": "Invalid class date/time format in data."}), 500
        
    return jsonify({"zoom_link": class_info.get('zoomLink')})


@app.route('/loadpapers', methods=['GET'])
def get_all_papers():
    # No authentication for papers, as per "anyone can download"
    papers_data = load_json(PAPERS_FILE)
    return jsonify(papers_data.get('papers', []))

@app.route('/loadrecordings', methods=['GET'])
def get_all_recordings():
    # No authentication for recordings
    recordings_data = load_json(RECORDINGS_FILE)
    return jsonify(recordings_data.get('recordings', []))











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


@app.route('/delete-account', methods=['POST'])
def delete_account():
    try:
        data = request.get_json()
        email = data.get('email')
        token = data.get('token')

        if not email or not token:
            return jsonify({"message": "Email and token are required"}), 400

        if not verify_token(email, token): # Verifies token and checks expiry
            return jsonify({"message": "Invalid or expired session"}), 401

        users = load_json(USERS_FILE)
        sessions = load_json(SESSIONS_FILE)

        if email not in users:
            return jsonify({"message": "User not found"}), 404

        # Delete user data
        del users[email]
        if email in sessions:
            del sessions[email]

        save_json(USERS_FILE, users)
        save_json(SESSIONS_FILE, sessions)

        # Attempt to delete user's Google Drive folder if service is available
        if drive_service:
            try:
                user_folder_id = get_or_create_user_subfolder(email) # This will find it if it exists
                if user_folder_id:
                    # To delete a folder, it must be empty, or use a different API call.
                    # For simplicity, we'll just delete the folder.
                    # If this fails due to non-empty, it needs more robust handling.
                    # Alternatively, just delete the PFP file if its ID is stored.
                    # For now, let's attempt to delete the folder directly.
                    # drive_service.files().delete(fileId=user_folder_id).execute()
                    # print(f"Attempted to delete Google Drive folder for {email}")
                    # A safer approach might be to just delete known files like PFP
                    # For now, we'll focus on JSON data removal.
                    # If ProfileImageFileID was stored:
                    # pfp_file_id = user.get("profileImageFileID") # Assuming 'user' was the dict before deletion
                    # if pfp_file_id:
                    # drive_service.files().delete(fileId=pfp_file_id).execute()
                    # print(f"Deleted PFP file for {email}")
                    
                    # Let's find the subfolder by email and delete it
                    query = f"'{FOLDER_ID}' in parents and name='{email}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
                    results = drive_service.files().list(q=query, fields="files(id)").execute()
                    user_gdrive_files = results.get('files', [])
                    if user_gdrive_files:
                        user_gdrive_folder_id = user_gdrive_files[0]['id']
                        drive_service.files().delete(fileId=user_gdrive_folder_id).execute()
                        print(f"Deleted Google Drive folder {user_gdrive_folder_id} for user {email}")

            except Exception as e_drive:
                print(f"Could not delete Google Drive folder for {email}: {e_drive}")
        
        send_embed_to_discord("Account Deletion", f"User account deleted: {email}")
        print(f"User account deleted: {email}")
        return jsonify({"message": "Account deleted successfully"}), 200

    except Exception as e:
        print(f"Error during account deletion: {e}")
        send_embed_to_discord("Account Deletion Error", f"Error deleting account {email}: {e}")
        return jsonify({"message": "An error occurred during account deletion"}), 500

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

                # This discord bot command for adding classes is basic.
                # The new teacher panel will use an HTTP endpoint.
                # Consider enhancing this or ensuring consistency if both are to be used.
                all_classes_data = load_json(CLASSES_FILE) # loads {'classes': []}
                all_classes_list = all_classes_data.get('classes', [])
                all_classes_list.append(new_class)
                save_json(CLASSES_FILE, {'classes': all_classes_list})

                await message.reply('Class added successfully via Discord bot!')
            except ValueError:
                await message.reply('Invalid date or time format. Please use YYYY-MM-DD for date and HH:MM for time.')

    await bot.process_commands(message)


# Teacher Panel Backend Logic

def upload_to_drive(file_data, filename, mime_type):
    if drive_service is None: # Check if drive_service was initialized
        print("WARNING: Google Drive service not available, cannot upload file.")
        # Fallback behavior or raise error
        # For now, let's return a mock link if Drive is unavailable, so frontend doesn't break
        # In a real scenario, you'd likely return an error.
        return f"mockdrive://{filename}" # Mock link
        # raise Exception("Google Drive service is not initialized. Cannot upload file.")
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
        
        return file.get('webViewLink') # This will be None if using mockdrive link
        
    except Exception as e:
        print(f"Drive upload error: {str(e)}")
        # If mockdrive is used, this exception block might not be hit for the "upload" part.
        # Depending on strictness, you might want to raise e here too.
        # For now, if upload_to_drive returned a mock link, this is fine.
        if "mockdrive://" not in str(e): # Avoid re-raising if it's due to mock
             raise
        return f"mockdrive://{filename}" # Return mock if error after init check


# These functions are no longer needed as we load real data.
# def get_user_count():
#     users = load_json(USERS_FILE)
#     return len(users)

# def generate_classes(): ...
# def generate_recordings(): ...
# def generate_papers(): ...

# These routes are replaced by /confirmteacherloggedin and /loadteacher
# @app.route('/api/auth/verify', methods=['POST'])
# def verify_auth(): ...
# @app.route('/api/teacher/data', methods=['POST'])
# def get_teacher_data(): ...


@app.route('/confirmteacherloggedin', methods=['POST'])
def confirm_teacher_logged_in():
    # This route confirms if the provided token for the email is valid AND the user is a teacher.
    data = request.json
    email = data.get('email')
    token = data.get('token')
    
    if not email or not token:
        return jsonify({"message": "Missing credentials"}), 400
        
    # For a real system, check against a list of teacher emails or a role.
    # Using the hardcoded email for now as it was the previous check.
    # Ensure this email is correct and does not have typos like a trailing '0'.
    is_teacher = (email in TEACHER_EMAILS)

    if not is_teacher:
         return jsonify({"message": "User is not authorized as a teacher"}), 403

    if not verify_token(email, token): # verify_token handles session validity
        return jsonify({"message": "Invalid or expired token"}), 401
        
    return jsonify({"message": "Teacher authorized"}), 200

@app.route('/loadteacher', methods=['POST'])
def load_teacher():
    data = request.json
    email = data.get('email')
    token = data.get('token')
    
    # Ensure this email is correct and does not have typos like a trailing '0'.
    is_teacher = (email in TEACHER_EMAILS)  # Replace with actual teacher check logic

    if not is_teacher:
        return jsonify({"message": "User is not authorized as a teacher"}), 403
        
    if not verify_token(email, token): # verify_token handles session validity
        return jsonify({"message": "Invalid or expired token"}), 401
    
    classes_data_full = load_json(CLASSES_FILE) # Expected: {"classes": [...]}
    recordings_data_full = load_json(RECORDINGS_FILE) # Expected: {"recordings": [...]}
    papers_data_full = load_json(PAPERS_FILE) # Expected: {"papers": [...]}
    courses_data_full = load_json(COURSES_FILE) # Expected: {"courses": [...]}

    all_users = load_json(USERS_FILE)
    
    classes_list = classes_data_full.get('classes', [])
    recordings_list = recordings_data_full.get('recordings', [])
    papers_list = papers_data_full.get('papers', [])
    courses_list = courses_data_full.get('courses', [])

    # Calculate stats
    pending_recordings = sum(1 for rec in recordings_list if rec.get('status') == 'pending')
    
    now_date = datetime.now().date()
    upcoming_classes_list = []
    past_classes_list = []
    for cls in classes_list:
        try:
            # Ensure date and time are correctly parsed. Assuming 'time' is just HH:MM.
            class_date_obj = datetime.strptime(cls.get('date'), '%Y-%m-%d').date()
            
            # Check if class is upcoming or past based on date only for simplicity here.
            # Time comparison can be added if a class on the same day needs to be categorized.
            if class_date_obj >= now_date:
                 # For classes on the current day, one might compare times to be more precise
                 # For now, same-day classes are considered upcoming until the day passes
                upcoming_classes_list.append(cls)
            else:
                past_classes_list.append(cls)
        except (ValueError, TypeError) as e:
            print(f"Skipping class due to invalid date format or missing date: {cls.get('id')} - {e}")
            continue

    upcoming_classes_count = len(upcoming_classes_list)
    
    # Calculate totalStudents. This was previously sum of 'studentsEnrolled' per class.
    # A more common interpretation is total registered users or students associated with the teacher.
    # For now, using total registered users as per prior logic.
    # The original 'totalStudents' calculation was: sum(cls['studentsEnrolled'] for cls in classes_data['classes'])
    # We'll use the count of all users for now, as per the previous successful change's intent for totalStudents.
    total_students = len(all_users) 
    
    papers_to_grade_count = len(papers_list) # Total number of papers

    return jsonify({
        "stats": {
            "pendingRecordings": pending_recordings,
            "upcomingClasses": upcoming_classes_count,
            "papersToGrade": papers_to_grade_count,
            "totalStudents": total_students
        },
        "recordings": recordings_list,
        "classes": { 
            "upcoming": sorted(upcoming_classes_list, key=lambda x: (x.get('date', ''), x.get('time', ''))),
            "past": sorted(past_classes_list, key=lambda x: (x.get('date', ''), x.get('time', '')), reverse=True)
        },
        "papers": papers_list,
        "courses": courses_list # Provide the list of courses
    })

@app.route('/upload/recording', methods=['POST'])
def upload_recording():
    email = request.form.get('email')
    token = request.form.get('token')
    
    # Ensure this email is correct and does not have typos like a trailing '0'.
    is_teacher = (email in TEACHER_EMAILS)
    if not is_teacher or not verify_token(email, token):
        return jsonify({"message": "Unauthorized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"message": "No file provided"}), 400
        
    file = request.files['file']
    recording_id_to_update = request.form.get('recordingId') 
    recording_title = request.form.get('title')
    recording_course_name = request.form.get('course') # from frontend 'courseName' in metadata
    recording_date = request.form.get('date')

    recordings_data_full = load_json(RECORDINGS_FILE)
    recordings_list = recordings_data_full.get('recordings', [])
    target_recording = None
    found_idx = -1

    for idx, rec in enumerate(recordings_list):
        if rec.get('id') == recording_id_to_update:
            target_recording = rec
            found_idx = idx
            break
    
    if not target_recording:
        return jsonify({"message": "Recording ID not found to update"}), 404
    
    try:
        file_bytes = file.read()
        drive_link = upload_to_drive(
            file_bytes, 
            f"recording_{target_recording['id']}_{secure_filename(file.filename)}", 
            file.content_type
        )
        
        target_recording['status'] = 'uploaded'
        target_recording['driveLink'] = drive_link 
        target_recording['link'] = drive_link 
        target_recording['filename'] = secure_filename(file.filename)
        target_recording['size'] = f"{len(file_bytes) / (1024*1024):.2f} MB"

        if recording_title: target_recording['title'] = recording_title
        if recording_course_name: target_recording['course'] = recording_course_name
        if recording_date: target_recording['date'] = recording_date
        target_recording['uploadDate'] = datetime.now().strftime('%Y-%m-%d')

        recordings_list[found_idx] = target_recording 
        save_json(RECORDINGS_FILE, {"recordings": recordings_list})
        
        return jsonify({
            "message": "Recording uploaded successfully",
            "driveLink": drive_link,
            "recording": target_recording 
        })
        
    except Exception as e:
        print(f"Error during recording upload: {e}")
        return jsonify({"message": f"Upload failed: {str(e)}"}), 500

@app.route('/upload/paper', methods=['POST'])
def upload_paper():
    email = request.form.get('email')
    token = request.form.get('token')
    
    # Ensure this email is correct and does not have typos like a trailing '0'.
    is_teacher = (email in TEACHER_EMAILS)
    if not is_teacher or not verify_token(email, token):
        return jsonify({"message": "Unauthorized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"message": "No file provided"}), 400
        
    file = request.files['file']
    paper_meta_json_str = request.form.get('data')
    paper_meta = {}
    if paper_meta_json_str:
        try:
            paper_meta = json.loads(paper_meta_json_str)
        except json.JSONDecodeError:
            return jsonify({"message": "Invalid paper metadata format"}), 400

    paper_title = paper_meta.get('title', secure_filename(file.filename).rsplit('.', 1)[0])
    paper_type = paper_meta.get('type', 'general') 
    paper_course = paper_meta.get('course', 'Uncategorized') 
    paper_grade = paper_meta.get('grade', 'Any') 

    papers_content = load_json(PAPERS_FILE) 
    papers_list = papers_content.get('papers', [])
    
    file_bytes = file.read() # Read file content once

    try:
        drive_link = upload_to_drive(
            file_bytes, 
            f"paper_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{secure_filename(file.filename)}",
            file.content_type
        )
        
        new_paper_id = f"doc{int(datetime.now().timestamp())}{len(papers_list) + 1}"
        new_paper = {
            "id": new_paper_id,
            "name": paper_title, 
            "title": paper_title, 
            "type": paper_type,
            "course": paper_course, 
            "grade": paper_grade,
            "year": str(datetime.now().year), 
            "uploadDate": datetime.now().strftime('%Y-%m-%d'),
            "size": f"{len(file_bytes) / 1024:.0f} KB", 
            "format": secure_filename(file.filename).split('.')[-1].lower() if '.' in secure_filename(file.filename) else 'unknown',
            "link": drive_link, 
            "driveLink": drive_link 
        }
        
        papers_list.append(new_paper)
        save_json(PAPERS_FILE, {"papers": papers_list})
        
        return jsonify({
            "message": "Paper uploaded successfully",
            "paper": new_paper 
        }), 201
        
    except Exception as e:
        print(f"Error during paper upload: {e}")
        return jsonify({"message": f"Upload failed: {str(e)}"}), 500

@app.route('/teacher/schedule-class', methods=['POST'])
def teacher_schedule_class():
    form_data = request.json 
    
    auth_email = form_data.get('auth_email') 
    auth_token = form_data.get('auth_token')

    # Ensure this email is correct and does not have typos like a trailing '0'.
    is_teacher = (auth_email in TEACHER_EMAILS)
    if not is_teacher or not verify_token(auth_email, auth_token):
        return jsonify({"message": "Unauthorized to schedule class"}), 401

    try:
        title = form_data.get('title')
        course_name = form_data.get('course') 
        class_date_str = form_data.get('date') 
        start_time_str = form_data.get('startTime') 
        duration_minutes = int(form_data.get('duration', 60)) 
        description = form_data.get('description', '')
        room = form_data.get('room', 'Online') 
        class_grade = form_data.get('grade', 'Any Grade') 
        default_zoom_link = f"https://zoom.us/j/example{int(datetime.now().timestamp())}"
        zoom_link = form_data.get('zoomLink', default_zoom_link)

        if not all([title, course_name, class_date_str, start_time_str]):
            return jsonify({"message": "Missing required fields (title, course, date, time)"}), 400

        class_start_datetime = datetime.strptime(f"{class_date_str} {start_time_str}", "%Y-%m-%d %H:%M")
        class_end_datetime = class_start_datetime + timedelta(minutes=duration_minutes)
        end_time_str_formatted = class_end_datetime.strftime("%H:%M")

        all_classes_data = load_json(CLASSES_FILE)
        classes_list = all_classes_data.get('classes', [])
        
        new_class_id = f"cls{int(datetime.now().timestamp())}_{len(classes_list)}"

        new_class = {
            "id": new_class_id,
            "title": title,
            "instructor": "Mr. Sanjaya", 
            "course": course_name, 
            "date": class_date_str,
            "time": start_time_str, 
            "startTime": start_time_str, 
            "endTime": end_time_str_formatted, 
            "duration": f"{duration_minutes} mins", 
            "spots": form_data.get('spots', 20), 
            "grade": class_grade,
            "zoomLink": zoom_link,
            "description": description,
            "room": room,
            "studentsEnrolled": 0,
            "studentsAttended": 0 
        }
        classes_list.append(new_class)
        save_json(CLASSES_FILE, {"classes": classes_list})

        return jsonify({"message": "Class scheduled successfully", "class": new_class}), 201
    except ValueError as ve:
        print(f"ValueError scheduling class: {ve}")
        return jsonify({"message": f"Invalid data format: {str(ve)}"}), 400
    except Exception as e:
        print(f"Error scheduling class: {e}")
        return jsonify({"message": "An error occurred while scheduling class"}), 500

# Teacher Panel Backend Logic - END

if __name__ == '__main__':
    # Ensure essential JSON files are initialized if they don't exist
    # USERS_FILE, SESSIONS_FILE are handled by load_json itself.
    # For others, we can add explicit checks or rely on load_json's default empty structures.
    if not os.path.exists(CLASSES_FILE):
        save_json(CLASSES_FILE, {"classes": []})
    if not os.path.exists(PAPERS_FILE):
        save_json(PAPERS_FILE, {"papers": []})
    if not os.path.exists(RECORDINGS_FILE):
        save_json(RECORDINGS_FILE, {"recordings": []})
    if not os.path.exists(COURSES_FILE):
        # Initialize with some default courses if none exist
        default_courses = {
            "courses": [
                {"id": "course1", "name": "Mathematics 101"},
                {"id": "course2", "name": "Physics 201"},
                {"id": "course3", "name": "Accounting Basics"},
                {"id": "course4", "name": "Advanced Business Studies"}
            ]
        }
        save_json(COURSES_FILE, default_courses)



    # The 'thebook' related file initializations
    # These use a 'data/' subdirectory, which is different from USERS_FILE etc.
    # This is kept separate as it seems to be for a distinct feature.
    if not os.path.exists('data'):
        os.makedirs('data')
    if not os.path.exists('data/restaurants.json'):
        with open('data/restaurants.json', 'w') as f: json.dump([], f)
    if not os.path.exists('data/reviews.json'):
        with open('data/reviews.json', 'w') as f: json.dump([], f)
    # Removed os.makedirs('sirdata', exist_ok=True) as it's not used.


    import threading
    bot_thread = threading.Thread(target=run_bot, daemon=True) # For the discord bot
    bot_thread.start()
    run_discord_bot()
    app.run(host='0.0.0.0', port=10209)
