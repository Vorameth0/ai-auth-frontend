import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

// 🔥 backend URL (Render)
const API = "https://ai-auth-backend-8vly.onrender.com";

function App() {
  const {
    isLoading,
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [expenses, setExpenses] = React.useState([]);
  const [budget, setBudget] = React.useState("");
  const [savedBudget, setSavedBudget] = React.useState(0);
  const [aiText, setAiText] = React.useState("");

  const COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

  const getToken = async () => {
    return await getAccessTokenSilently({
      authorizationParams: {
        audience: "https://my-api",
      },
    });
  };

  // LOAD
  const loadExpenses = async () => {
    try {
      const token = await getToken();

      const res = await fetch(`${API}/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      alert("❌ Load failed");
    }
  };

  // ADD
  const addExpense = async () => {
    if (!amount || !category.trim()) {
      return alert("กรอกข้อมูลให้ครบ");
    }

    try {
      const token = await getToken();

      const res = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          category,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      setAmount("");
      setCategory("");

      await loadExpenses();
      alert("✅ Added!");
    } catch (err) {
      console.error(err);
      alert("❌ Add failed: " + err.message);
    }
  };

  // 🤖 AI (🔥 FIXED)
  const getAI = async () => {
    try {
      const token = await getToken();

      const res = await fetch(`${API}/ai-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setAiText(data.message || "ไม่มีข้อมูล"); // ✅ FIX ตรงนี้
    } catch (err) {
      console.error(err);
      setAiText("AI error");
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      loadExpenses();
    }
  }, [isAuthenticated]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = savedBudget - total;

  const chartData = Object.values(
    expenses.reduce((acc, e) => {
      if (!e.category) return acc;

      acc[e.category] = acc[e.category] || {
        name: e.category,
        value: 0,
      };

      acc[e.category].value += e.amount;
      return acc;
    }, {})
  );

  if (isLoading) return <div style={{ marginTop: 50 }}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💰 AI Budget Tracker</h1>

      {isAuthenticated ? (
        <div style={styles.card}>
          <img src={user.picture} alt="" style={styles.avatar} />
          <h2>{user.nickname}</h2>
          <p style={styles.email}>{user.email}</p>

          {/* BUDGET */}
          <div style={styles.section}>
            <h3>💰 Budget</h3>
            <input
              style={styles.input}
              placeholder="Budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
            <button
              style={styles.primaryBtn}
              onClick={() => {
                setSavedBudget(Number(budget));
                setBudget("");
                alert("✅ Budget saved");
              }}
            >
              Save Budget
            </button>
          </div>

          {/* ADD */}
          <div style={styles.section}>
            <h3>➕ Add Expense</h3>
            <input
              style={styles.input}
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <button style={styles.primaryBtn} onClick={addExpense}>
              Add Expense
            </button>
            <button style={styles.secondaryBtn} onClick={loadExpenses}>
              Refresh
            </button>
          </div>

          {/* LIST */}
          <div style={styles.section}>
            <h3>📊 Expenses</h3>

            {expenses.length === 0 ? (
              <p style={{ color: "#888" }}>No data</p>
            ) : (
              expenses.map((e, i) => (
                <div key={i} style={styles.expenseItem}>
                  <span>
                    {e.category} - {e.amount} THB
                  </span>
                </div>
              ))
            )}
          </div>

          {/* SUMMARY */}
          <div style={styles.summaryBox}>
            <h3>📊 Summary</h3>
            <p>Total: {total} THB</p>
            <p
              style={{
                color: remaining < 0 ? "red" : "green",
                fontWeight: "bold",
              }}
            >
              Remaining: {remaining} THB
            </p>

            <button style={styles.secondaryBtn} onClick={getAI}>
              🤖 Analyze
            </button>

            {aiText && <p style={styles.aiText}>{aiText}</p>}
          </div>

          {/* CHART */}
          {chartData.length > 0 && (
            <PieChart width={280} height={280}>
              <Pie data={chartData} dataKey="value" outerRadius={100}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}

          {/* LOGOUT */}
          <button
            style={styles.logoutBtn}
            onClick={() =>
              logout({
                logoutParams: {
                  returnTo: window.location.origin,
                },
              })
            }
          >
            Logout
          </button>
        </div>
      ) : (
        <div>
          <button
            style={styles.primaryBtn}
            onClick={() =>
              loginWithRedirect({
                authorizationParams: {
                  prompt: "login",
                },
              })
            }
          >
            Login
          </button>

          <button
            style={styles.secondaryBtn}
            onClick={() =>
              loginWithRedirect({
                authorizationParams: {
                  screen_hint: "signup",
                },
              })
            }
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: 40,
  },
  title: { marginBottom: 20 },
  card: {
    width: 340,
    padding: 25,
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
    textAlign: "center",
    background: "#fff",
  },
  avatar: {
    width: 70,
    borderRadius: "50%",
    marginBottom: 10,
  },
  email: {
    color: "#777",
    fontSize: 14,
  },
  section: {
    marginTop: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 8,
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  primaryBtn: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
  },
  secondaryBtn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#e5e7eb",
    cursor: "pointer",
  },
  expenseItem: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#f9fafb",
  },
  summaryBox: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    background: "#f3f4f6",
  },
  aiText: {
    marginTop: 10,
    fontStyle: "italic",
  },
  logoutBtn: {
    marginTop: 20,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
  },
};

export default App;