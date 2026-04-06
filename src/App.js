import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

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

  const getToken = React.useCallback(async () => {
    return await getAccessTokenSilently({
      authorizationParams: {
        audience: "https://my-api",
      },
    });
  }, [getAccessTokenSilently]);

  const loadExpenses = React.useCallback(async () => {
    try {
      const token = await getToken();

      const res = await fetch(`${API}/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Load failed");
      }

      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      alert("❌ Load failed");
    }
  }, [getToken]);

  const addExpense = async () => {
    if (!amount || !category.trim()) {
      alert("กรอกข้อมูลให้ครบ");
      return;
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

  const deleteExpense = async (id) => {
    try {
      const token = await getToken();

      const res = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      await loadExpenses();
    } catch (err) {
      console.error(err);
      alert("❌ Delete failed: " + err.message);
    }
  };

  const getAI = async () => {
    try {
      const token = await getToken();

      const res = await fetch(`${API}/ai-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setAiText(data.message || "ไม่มีข้อมูล");
    } catch (err) {
      console.error(err);
      setAiText("AI error");
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      loadExpenses();
    }
  }, [isAuthenticated, loadExpenses]);

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const remaining = savedBudget - total;

  const chartData = Object.values(
    expenses.reduce((acc, expense) => {
      if (!expense.category) return acc;

      if (!acc[expense.category]) {
        acc[expense.category] = {
          name: expense.category,
          value: 0,
        };
      }

      acc[expense.category].value += Number(expense.amount || 0);
      return acc;
    }, {})
  );

  if (isLoading) {
    return <div style={{ marginTop: 50 }}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💰 AI Budget Tracker</h1>

      {isAuthenticated ? (
        <div style={styles.card}>
          <img src={user.picture} alt="profile" style={styles.avatar} />
          <h2>{user.nickname}</h2>
          <p style={styles.email}>{user.email}</p>

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

          <div style={styles.section}>
            <h3>📊 Expenses</h3>

            {expenses.length === 0 ? (
              <p style={{ color: "#888" }}>No data</p>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} style={styles.expenseItem}>
                  <span>
                    {expense.category} - {expense.amount} THB
                  </span>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteExpense(expense.id)}
                  >
                    🗑
                  </button>
                </div>
              ))
            )}
          </div>

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

          {chartData.length > 0 && (
            <PieChart width={280} height={280}>
              <Pie data={chartData} dataKey="value" outerRadius={100}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}

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
    alignItems: "center",
    marginTop: 8,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#f9fafb",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
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
    whiteSpace: "pre-wrap",
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