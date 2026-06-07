const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const analyzeResume = async (resumeText, jobRequirements = "General Application") => {

  const completion =
    await client.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: `
          You are an expert HR recruiter. Your job is to accurately grade how well a candidate's resume matches the Target Job Requirements provided by the user.
          
          Return ONLY raw JSON.
          Do not use markdown.
          Do not wrap response inside triple backticks.
          
          CRITICAL FOR MATCH SCORE:
          - Look at the Target Job Requirements provided below.
          - Evaluate the candidate's resume text thoroughly.
          - Under the "score" key, return a matching score between 0.0 and 10.0 based strictly on how well their skills, experience, and background match the requirements.
          
          Target Job Requirements:
          ${jobRequirements}
          
          Format:
          {
            "name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "experience": "",
            "education": "",
            "strengths": [],
            "weaknesses": [],
            "score": 0,
            "recommendation": ""
          }
          
          Recommendation options:
          Shortlist
          Consider
          Reject
          `,
        },
        {
          role: "user",
          content: `Here is the candidate's Resume Text:\n\n${resumeText}`,
        },
      ],

      temperature: 0.3,
    });

  return completion.choices[0].message.content;
};
const recruiterAIChat =
async (
  message,
  candidates
) => {

  const completion =
    await client.chat.completions.create({

      model:
        "llama-3.3-70b-versatile",

      messages: [

        {
          role: "system",

          content: `
You are an AI Recruitment Assistant.

Answer recruiter questions using candidate data.

Candidate Data:

${JSON.stringify(candidates)}
`,
        },

        {
          role: "user",
          content: message,
        },

      ],

      temperature: 0.3,

    });

  return completion
    .choices[0]
    .message
    .content;
};

module.exports = {
  analyzeResume,
  recruiterAIChat,
};