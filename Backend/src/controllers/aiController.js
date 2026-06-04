const Candidate =
  require("../models/Candidate");

const {
  recruiterAIChat,
} = require("../services/aiService");

const chatWithFWCAI = async (req, res) => {

  try {

    const {
      message,
      role,
    } = req.body;

    let reply = "";

    if (role === "recruiter") {

      const candidates =
        await Candidate.find();

      reply =
        await recruiterAIChat(
          message,
          candidates
        );

    }

    else if (role === "admin") {

      reply =
        await recruiterAIChat(
          message,
          []
        );
    
    }

    else {

      reply =
        "FWCAI received your request.";

    }

    res.status(200).json({
      success: true,
      reply,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = {
  chatWithFWCAI,
};