from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import tempfile
import os
import json
import re

app = Flask(__name__)
CORS(app)

GENAI_API_KEY = "AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM"  # Replace with your actual API key
genai.configure(api_key=GENAI_API_KEY)
model = genai.GenerativeModel("models/gemini-1.5-flash")

@app.route('/extract-guidelines', methods=['POST'])
def extract_guidelines():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name
    try:
        file_ref = genai.upload_file(tmp_path, mime_type="application/pdf")
        prompt = (
            "Extract all brand design guideline information from this PDF and return it in a single JSON object.\n\n"
            "INSTRUCTIONS:\n"
            
            "Return the result as a single JSON object containing all extracted information.\n\n"
            "Fill in as much detail as possible for each field, using only the precise values from the document."
        )
        response = model.generate_content([prompt, file_ref])
        print(response.text)
        try:
            data = response.text
            # Cleanse the data: extract JSON between ```json and ```
            match = re.search(r"```json\s*(\{.*?\})\s*```", data, re.DOTALL)
            if match:
                data = match.group(1)
            json_data = json.loads(data)
        except Exception:
            return jsonify({'error': 'Failed to parse JSON from Gemini response', 'raw': response.text}), 500
        return jsonify(json_data)
    finally:
        os.remove(tmp_path)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
