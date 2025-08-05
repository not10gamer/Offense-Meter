import json
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    text = request.json['text']

    prompt = f"""
    Analyze the following text for racism, sexism, and homophobia, religious blasphemy, and "something the parents wont like you saying". 
    For each of these categories, provide a score from 0 to 100, where 0 is not offensive and 100 is very offensive, and a reason for the score.

    Additionally, analyze the text for offenses against other specific minority groups. 
    Identify each group and provide a score and reason for each.

    Text: "{text}"

    Return the response as a JSON object with keys "racism", "sexism", "homophobia", "religious_blasphemy", and "parental_disapproval".
    Each of these keys should have a corresponding object with "score" and "reason".
    Also include a key named "other_minorities", which should be an array of objects. Each object in the array should have "group", "score", and "reason" keys.
    """

    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content(prompt)

    clean_response_text = response.text.strip().replace('```json', '').replace('```', '')

    try:
        data = json.loads(clean_response_text)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid response from AI model"}), 500

    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True)
