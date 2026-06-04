import { useState, useEffect, useRef } from "react";
import { Bot, X } from "lucide-react";
import axios from "axios";

export default function FWCAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);
  const [input, setInput] = useState("");

  const actions = {
    "Generate Workforce Report":
      "Workforce Report Generated. Total Employees: 5247, Attendance: 98.4%, Open Positions: 324.",
  
    "Attendance Insights":
      "Attendance rate is currently 98.4%. Two attendance anomalies detected this month.",
  
    "Employee Analytics":
      "Total Employees: 5247. Top performing department: Engineering.",
  
    "Workforce Risk Analysis":
      "12 employees have been identified as potential attrition risks.",
  };
  
  const recruiterActions = {
    "Show Shortlisted Candidates":
      "Show shortlisted candidates",
  
    "Top Scoring Candidates":
      "Show candidates with highest scores",
  
    "React Developers":
      "Show candidates with React skills",
  
    "Hiring Summary":
      "Give hiring summary",
  };

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello Nikhil 👋 How can I help you today?",
    },
  ]);

  const getRole = () => {

    const path =
      window.location.pathname;
  
    if (
      path.includes("/admin")
    )
      return "admin";
  
    if (
      path.includes("/recruiter")
    )
      return "recruiter";
  
    if (
      path.includes("/employee")
    )
      return "employee";
  
    if (
      path.includes("/seniormanager")
    )
      return "seniorManager";
  
    return "admin";
  };

  const handleSendMessage = async () => {

    if (!input.trim()) return;
  
    const userMessage = input;
  
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
      },
    ]);
  
    setInput("");
  
    try {
  
      const response = await axios.post(
        "http://localhost:5000/api/fwcai",
        {
          role: getRole(),
          message: userMessage,
        }
      );
  
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: response.data.reply,
        },
      ]);
  
    } catch (error) {
  
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Server connection failed.",
        },
      ]);
  
    }
  
  };
  const handleSuggestion = (question, answer) => {

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: question,
      },
      {
        sender: "ai",
        text: answer,
      },
    ]);
  
    setRecentSearches((prev) => {
  
      const updated = [
        question,
        ...prev.filter(
          (item) => item !== question
        ),
      ];
  
      return updated.slice(0, 3);
  
    });
  
  };

  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          ref={popupRef}
          className={`
  fixed
  bottom-24
  right-4
  sm:right-6
  bg-white
  rounded-3xl
  shadow-2xl
  border
  border-slate-200
  z-50
  overflow-hidden
  ${
    isExpanded
      ? "w-[90vw] sm:w-[650px] h-[80vh]"
      : "w-[90vw] sm:w-96 h-[70vh]"
  }
`}
        >
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold">
                FWCAI Assistant
              </h2>

              <p className="text-xs opacity-80">
                Online
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setIsExpanded(!isExpanded)
                }
              >
                ⛶
              </button>

              <button
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col gap-4 h-full">

            {/* Messages */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl ${
                    message.sender === "user"
                      ? "bg-indigo-600 text-white ml-8"
                      : "bg-slate-100 mr-8"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            {/* Quick Menu */}
            {showMenu && (
  <div className="bg-slate-50 rounded-2xl p-4 flex-1 overflow-y-auto">

                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">
                    Quick Menu
                  </h3>

                  <button
                    onClick={() =>
                      setShowMenu(false)
                    }
                    className="text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Recent Searches */}
                <div className="space-y-2 mb-4">

  {recentSearches.length === 0 ? (

    <div className="text-slate-400 text-sm">
      No recent searches
    </div>

  ) : (

    recentSearches.map((item, index) => (
        <div
          key={index}
          onClick={() =>
            handleSuggestion(
              item,
              actions[item]
            )
          }
          className="
            bg-white
            p-3
            rounded-xl
            cursor-pointer
            hover:bg-slate-100
          "
        >
          {item}
        </div>
      ))
  )}

</div>

                {/* Quick Actions */}
                <h4 className="font-semibold text-slate-500 mb-2">
                  Quick Actions
                </h4>

                <div className="space-y-2">

                  <div
                    onClick={() =>
                      handleSuggestion(
                        "Generate Workforce Report",
                        actions["Generate Workforce Report"]
                      )
                    }
                    className="bg-white p-3 rounded-xl cursor-pointer hover:bg-slate-100"
                  >
                    📄 Generate Workforce Report
                  </div>

                  <div
                    onClick={() =>
                        handleSuggestion(
                          "Attendance Insights",
                          actions["Attendance Insights"]
                        )
                      }
                    className="bg-white p-3 rounded-xl cursor-pointer hover:bg-slate-100"
                  >
                    📊 Attendance Insights
                  </div>

                  <div
                    onClick={() =>
                      handleSuggestion(
                        "Employee Analytics",
                        actions["Employee Analytics"]
                      )
                    }
                    className="bg-white p-3 rounded-xl cursor-pointer hover:bg-slate-100"
                  >
                    👥 Employee Analytics
                  </div>

                  <div
                    onClick={() =>
                      handleSuggestion(
                        "Workforce Risk Analysis",
                        actions["Workforce Risk Analysis"]
                      )
                    }
                    className="bg-white p-3 rounded-xl cursor-pointer hover:bg-slate-100"
                  >
                    ⚠ Workforce Risk Analysis
                  </div>

                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">

              {!showMenu && (
                <button
                  onClick={() =>
                    setShowMenu(true)
                  }
                  className="
                    px-4
                    rounded-xl
                    bg-slate-100
                    hover:bg-slate-200
                  "
                >
                  ☰
                </button>
              )}

<input
  type="text"
  value={input}
  onChange={(e) =>
    setInput(e.target.value)
  }
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  }}
  placeholder="Ask FWCAI..."
  className="
    flex-1
    border
    rounded-xl
    px-4
    py-3
    outline-none
  "
/>
<button
  onClick={handleSendMessage}
  className="
    px-4
    rounded-xl
    bg-indigo-600
    text-white
    hover:bg-indigo-700
  "
>
  ➤
</button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-16
            h-16
            rounded-full
            bg-indigo-600
            text-white
            shadow-2xl
            hover:scale-110
            transition-all
            duration-300
            flex
            items-center
            justify-center
          "
        >
          <Bot size={30} />
        </button>

        <div
          className="
            absolute
            -top-1
            -right-1
            w-4
            h-4
            bg-green-500
            rounded-full
            border-2
            border-white
          "
        />

      </div>
    </>
  );
}