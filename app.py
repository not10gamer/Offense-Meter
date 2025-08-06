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
    Analyze the following text for multiple categories of offense. Your entire response must be a single, valid JSON object.

    Text: "{text}"

    1.  **Categorical Analysis**:
        -   For each of the main categories ("racism", "sexism", "homophobia", "religious_blasphemy", "parental_disapproval"), provide an object with:
            -   `ai_score`: An integer from 0-100 for your direct assessment of offensiveness.
            -   `potential_score`: An integer from 0-100 for how the most sensitive audience might perceive it.
            -   `reason`: A single, brief explanation for the scores.
        -   Include a key named "other_minorities", an array of objects for any other groups, each with "group", `ai_score`, `potential_score`, and `reason`. Do not include "LGBTQ+".

    2.  **Summary & Consequences**:
        -   `shaming_line`: A short, witty, and shaming line to the user based on the scores.
        -   `probability_beaten_up`: An integer from 0-100.
        -   `probability_cancelled`: An integer from 0-100.

    3.  **History & Highlighting**:
        -   `history_summary`: A very short, one-to-ten word summary of the text's theme.
        -   `conversational_reception_score`: An integer from 0-100 (100 = very well received).
        -   `problematic_words`: An array of the specific words or short phrases from the original text that contributed most to the offense scores. Return an empty array if none are found.

    **Formatting Rules**:
    -   All scores and probabilities must be specific integers (e.g., 27, 83, 91, not 25, 80, 90).
    -   The final output must be only the JSON object, with no markdown formatting like ```json.
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

