import { useEffect } from "react";

function App() {

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);

  return (
    <div>
      <h1>SOC Dashboard</h1>
    </div>
  );
}

export default App;