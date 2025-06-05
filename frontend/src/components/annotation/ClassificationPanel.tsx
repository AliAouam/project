import React, { useState } from "react";

interface Annotation {
  id?: string;
  type?: string;
  severity?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  created?: string;
}

interface AIPrediction {
  label: string;
  confidence: number;
}

interface Props {
  patientId: string;
  patientName: string;
  imagePath: string;
  annotations: Annotation[];
  aiPrediction?: AIPrediction;
}

const diseaseLabels = [
  "Rétinopathie diabétique",
  "Rétinopathie hypertensive",
  "Rétinopathie du prématuré",
  "Rétinopathie drépanocytaire",
  "Rétinopathie séreuse centrale",
  "Rétinopathie pigmentaire",
];

const ClassificationPanel: React.FC<Props> = ({
  patientId,
  patientName,
  imagePath,
  annotations,
  aiPrediction,
}) => {
  const [manualLabel, setManualLabel] = useState<string>("");

  // Fonction pour exporter en JSON (déjà présente)
  const handleExport = () => {
    const exportData = {
      patientId,
      patientName,
      imagePath,
      manual_label: manualLabel,
      ai_prediction: aiPrediction,
      annotations,
      comparison: aiPrediction
        ? aiPrediction.label === manualLabel
          ? "Identique"
          : "Différent"
        : "En attente",
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${patientId}_annotations_export.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // Fonction pour sauvegarder en base via l'API FastAPI
  const handleSaveToDB = async () => {
    const exportData = {
      patientId,
      patientName,
      imagePath,
      manual_label: manualLabel,
      ai_prediction: aiPrediction,
      annotations,
      comparison: aiPrediction
        ? aiPrediction.label === manualLabel
          ? "Identique"
          : "Différent"
        : "En attente",
      exported_at: new Date().toISOString(),
    };

    try {
      const response = await fetch("http://localhost:8000/classifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Classification sauvegardée avec succès !");
      } else {
        alert("Erreur lors de la sauvegarde : " + data.detail);
      }
    } catch (error: any) {
      alert("Erreur réseau lors de la sauvegarde.");
      console.error(error);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-md mt-4">
      <h3 className="text-lg font-semibold mb-2">Classification Globale</h3>

      <label className="block mb-2 text-sm font-medium">Sélection manuelle :</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={manualLabel}
        onChange={(e) => setManualLabel(e.target.value)}
      >
        <option value="">-- Choisir une maladie --</option>
        {diseaseLabels.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>

      {aiPrediction && (
        <div className="mb-4 p-2 bg-blue-50 rounded">
          <p>
            <strong>Prédiction IA :</strong> {aiPrediction.label}
          </p>
          <p>
            <strong>Confiance :</strong> {aiPrediction.confidence.toFixed(1)}%
          </p>
        </div>
      )}

      {manualLabel && aiPrediction && (
        <div className="mb-4">
          <p className="font-medium">
            Résultat comparaison :{" "}
            {manualLabel === aiPrediction.label ? (
              <span className="text-green-600">✅ Identique</span>
            ) : (
              <span className="text-red-600">❌ Différent</span>
            )}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!manualLabel}
        >
          Exporter en JSON
        </button>
        <button
          onClick={handleSaveToDB}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={!manualLabel}
        >
          Sauvegarder en DB
        </button>
      </div>
    </div>
  );
};

export default ClassificationPanel;
