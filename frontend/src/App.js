import { useEffect } from "react";

function App() {
  useEffect(() => {
    console.log("App loaded");
    fetch("http://localhost:5000/api/health")
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>SOC Dashboard</h1>
    </div>
  );
}

export default App;