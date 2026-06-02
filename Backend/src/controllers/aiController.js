const chatWithFWCAI = async (req, res) => {
    const { message } = req.body;
  
    let reply = "";
  
    if (
      message.toLowerCase().includes("attendance")
    ) {
      reply =
        "Current attendance rate is 98.4%.";
    } else if (
      message.toLowerCase().includes("employee")
    ) {
      reply =
        "Total employees: 5247.";
    } else if (
      message.toLowerCase().includes("report")
    ) {
      reply =
        "Workforce report generated successfully.";
    } else {
      reply =
        "FWCAI received your request.";
    }
  
    res.status(200).json({
      success: true,
      reply,
    });
  };
  
  module.exports = {
    chatWithFWCAI,
  };