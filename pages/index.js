import { useState, useEffect } from "react";
import avgData from "../public/avg_price_data.json";

const ramAdjustments = {
  "4GB": -2,
  "8GB": 0,
  "16GB": 7,
  "32GB": 17,
  "64GB": 37,
};

const hddAdjustments = {
  "128GB": 3,
  "256GB": 7,
  "512GB": 15,
  "1TB": 25,
  "2TB": 50,
};

const gradeAdjustments = {
  A: 0.15,
  B: 0,
  C: -0.15,
  F: "fixed",
};

const fGradePrices = {
  old: 15,
  new: 40,
};

const cpuUpgradeAdjustment = 25;

function App() {
  const [form, setForm] = useState({
    type: "",
    make: "",
    model: "",
    cpu: "",
    ram: "8GB",
    hdd: "256GB",
    grade: "B",
  });

  const [options, setOptions] = useState({
    make: [],
    model: [],
    cpu: [],
  });

  const [price, setPrice] = useState(null);

  useEffect(() => {
    const makes = [...new Set(avgData.map((d) => normalize(d.make)))];
    setOptions((prev) => ({ ...prev, make: makes }));
  }, []);

  useEffect(() => {
    if (form.make) {
      const models = avgData
        .filter((d) => normalize(d.make) === form.make && normalize(d.type) === form.type)
        .map((d) => d.model);
      setOptions((prev) => ({ ...prev, model: [...new Set(models)] }));
    }
  }, [form.make, form.type]);

  useEffect(() => {
    if (form.make && form.model) {
      const cpus = avgData
        .filter((d) => d.make && normalize(d.make) === form.make && d.model === form.model)
        .map((d) => normalizeCPU(d.cpu));
      setOptions((prev) => ({ ...prev, cpu: [...new Set(cpus)] }));
    }
  }, [form.model]);

  const normalize = (text) =>
    text?.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/PANASONICCORPORATION/, "PANASONIC") || "";

  const normalizeCPU = (cpu) => {
    const match = cpu?.match(/i[3579]\s?-?\s?(\d{4,5})/i);
    if (!match) return "Other";
    const series = match[1];
    const gen = parseInt(series.substring(0, series.length - 3));
    if (series.startsWith("13")) return `Intel i${series[0]} 13th Gen`;
    if (series.startsWith("12")) return `Intel i${series[0]} 12th Gen`;
    if (series.startsWith("11")) return `Intel i${series[0]} 11th Gen`;
    if (series.startsWith("10")) return `Intel i${series[0]} 10th Gen`;
    if (gen === 9) return `Intel i${series[0]} 9th Gen`;
    if (gen === 8) return `Intel i${series[0]} 8th Gen`;
    return `Intel i${series[0]} Older Gen`;
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "make") setForm((prev) => ({ ...prev, model: "", cpu: "" }));
    if (key === "model") setForm((prev) => ({ ...prev, cpu: "" }));
  };

  const getASP = () => {
    const baseEntry = avgData.find(
      (d) =>
        normalize(d.make) === form.make &&
        d.model === form.model &&
        normalizeCPU(d.cpu) === form.cpu &&
        normalize(d.type) === form.type
    );

    let asp = baseEntry?.asp;

    // If no exact ASP found, try fallback by model only
    if (!asp) {
      const modelFallback = avgData.find(
        (d) => normalize(d.make) === form.make && d.model === form.model
      );
      asp = modelFallback?.asp;
    }

    if (!asp && form.grade === "F") {
      const is8thGenOrNewer = form.cpu.includes("8th") || form.cpu.includes("9th") || form.cpu.includes("10") || form.cpu.includes("11") || form.cpu.includes("12") || form.cpu.includes("13");
      asp = is8thGenOrNewer ? fGradePrices.new : fGradePrices.old;
    }

    if (!asp) return setPrice("No baseline data found");

    if (form.grade !== "F") {
      const ramAdj = ramAdjustments[form.ram] || 0;
      const hddAdj = hddAdjustments[form.hdd] || 0;
      const cpuAdj = form.cpu.includes("i7") && !baseEntry.cpu.includes("i7") ? cpuUpgradeAdjustment : 0;
      const gradeAdj = gradeAdjustments[form.grade] ?? 0;
      const adjusted = asp + ramAdj + hddAdj + cpuAdj;
      const finalPrice = adjusted * (1 + gradeAdj);
      setPrice(`$${finalPrice.toFixed(2)}`);
    } else {
      setPrice(`$${asp.toFixed(2)}`);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", padding: 40, textAlign: "center" }}>
      <h1 style={{ color: "#2F5D3A" }}>Mender ASP Estimator</h1>
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "left" }}>
        {[
          { label: "What type of device are you pricing?", key: "type", values: ["Laptop", "Desktop", "AIO"] },
          { label: "What is the manufacturer?", key: "make", values: options.make },
          { label: "What is the model number?", key: "model", values: options.model },
          { label: "What processor does it have?", key: "cpu", values: options.cpu },
          { label: "How much RAM?", key: "ram", values: ["4GB", "8GB", "16GB", "32GB", "64GB"] },
          { label: "What is the hard drive size?", key: "hdd", values: ["128GB", "256GB", "512GB", "1TB", "2TB"] },
          { label: "What is the condition?", key: "grade", values: ["A", "B", "C", "F"] },
        ].map((q, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <label>{i + 1}. {q.label}</label>
            <select
              value={form[q.key]}
              onChange={(e) => handleChange(q.key, e.target.value)}
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            >
              <option value="">Select...</option>
              {q.values.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        ))}
        <button onClick={getASP} style={{ width: "100%", padding: 10, background: "#2F5D3A", color: "#fff", fontWeight: "bold" }}>
          Get ASP
        </button>
        {price && <h3 style={{ marginTop: 20 }}>Estimated ASP: {price}</h3>}
      </div>
    </div>
  );
}

export default App;
