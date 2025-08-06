import json
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# It's recommended to get the API key from environment variables in production
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables.")

genai.configure(api_key=api_key)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    text = request.json['text']

    prompt = f"""
    Analyze the following text for multiple categories of offense. For each category, provide two scores and a single reason.
    1.  `ai_score`: A score from 0-100 representing your direct assessment of how offensive the text is.
    2.  `potential_score`: A score from 0-100 representing how offensive the text *could be perceived* by the most sensitive audience for that category.
    3.  `reason`: A single explanation for both scores.

    Text: "{text}"

    Return the response as a JSON object. The keys should be "racism", "sexism", "homophobia", "religious_blasphemy", and "parental_disapproval".
    Each key's value should be an object containing `ai_score`, `potential_score`, and `reason`.

    Also include a key named "other_minorities", which should be an array of objects. Each object in the array should have "group", `ai_score`, `potential_score`, and `reason` keys.
    Do not include "LGBTQ+" in the "other_minorities" array, as it is already covered by the "homophobia" category.

    Next, include a key named "shaming_line" with a short, witty, and shaming line to the user based on the scores. The line should get more intense as the scores increase.

    Then, add two more keys at the top level of the JSON object:
    1. "probability_beaten_up": An integer from 0-100 representing the probability of the user being physically assaulted in public for saying this.
    2. "probability_cancelled": An integer from 0-100 representing the probability of the user being "cancelled" on social media for saying this.

    Finally, add these two keys for the history feature:
    1. "history_summary": A very short, one-to-ten word summary of what the AI thinks of the work.
    2. "conversational_reception_score": An integer from 0-100 indicating how well the text would be received in a typical conversation (where 100 is very well and 0 is very poorly).

    Important: When generating all scores and probabilities, please use highly specific integers. Avoid rounding or defaulting to numbers that are multiples of 5 or 10 (e.g., use 27, 83, 91 instead of 25, 80, 90).

    The entire output must be a single, valid JSON object.
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        response = model.generate_content(prompt)

        clean_response_text = response.text.strip().lstrip('```json').rstrip('```')

        data = json.loads(clean_response_text)
        return jsonify(data)

    except json.JSONDecodeError:
        print("Error: Could not parse JSON from model response.")
        return jsonify({"error": "Invalid response from AI model"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

