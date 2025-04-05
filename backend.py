from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)