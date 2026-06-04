const Candidate =
require("../models/Candidate");

const getRecruiterAnalytics =
async (req, res) => {

  try {

    const candidates =
      await Candidate.find();

    const totalCandidates =
      candidates.length;

    const shortlisted =
      candidates.filter(
        c => c.recommendation === "Shortlist"
      ).length;

    const considered =
      candidates.filter(
        c => c.recommendation === "Consider"
      ).length;

    const rejected =
      candidates.filter(
        c => c.recommendation === "Reject"
      ).length;

    const averageScore =
      candidates.length > 0
        ? (
            candidates.reduce(
              (sum, c) =>
                sum + c.score,
              0
            ) /
            candidates.length
          ).toFixed(1)
        : 0;

    res.json({
      success: true,
      totalCandidates,
      shortlisted,
      considered,
      rejected,
      averageScore,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = {
  getRecruiterAnalytics,
};