const getEmployees = async (req, res) => {

    res.status(200).json([
      {
        id: 1,
        name: "Nikhil",
        department: "Engineering",
      },
      {
        id: 2,
        name: "Rahul",
        department: "HR",
      },
    ]);
  
  };
  
  module.exports = {
    getEmployees,
  };