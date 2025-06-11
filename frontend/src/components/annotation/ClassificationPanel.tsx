import React from "react";

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
  manualLabel: string;
  setManualLabel: (v: string) => void;
  stage: string;
  setStage: (v: string) => void;
  otherDisease: string;
  setOtherDisease: (v: string) => void;
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
  manualLabel,
  setManualLabel,
  stage,
  setStage,
  otherDisease,
  setOtherDisease,
}) => {


  // Fonction pour sauvegarder en base via l'API FastAPI
  const handleSaveToDB = async () => {
    const exportData = {
      patientId,
      patientName,
      imagePath,
      manual_label: manualLabel,
      stage: manualLabel === 'No DR' ? null : stage,
      other_disease: manualLabel === 'No DR' ? otherDisease : null,
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
      const response = await fetch("http://localhost:8000/api/classifications", {
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

      <label className="block mb-2 text-sm font-medium">Type d'anomalie :</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={manualLabel}
        onChange={(e) => {
          setManualLabel(e.target.value)
          setStage('')
          setOtherDisease('')
        }}
      >
        <option value="">-- Choisir --</option>
        <option value="No DR">No DR</option>
        {diseaseLabels.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>

      {manualLabel && manualLabel !== 'No DR' && (
        <>
          <label className="block mb-2 text-sm font-medium">Stade :</label>
          <select
            className="border p-2 rounded w-full mb-4"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">-- Choisir le stade --</option>
            {[1,2,3,4].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </>
      )}

      {manualLabel === 'No DR' && (
        <>
          <label className="block mb-2 text-sm font-medium">Autres maladies oculaires :</label>
          <input
            type="text"
            className="border p-2 rounded w-full mb-4"
            value={otherDisease}
            onChange={(e) => setOtherDisease(e.target.value)}
            placeholder="Précisez si besoin"
          />
        </>
      )}

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
          onClick={handleSaveToDB}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={!manualLabel || (manualLabel !== 'No DR' && !stage)}
        >
          Sauvegarder en DB
        </button>
      </div>
    </div>
  );
};

export default ClassificationPanel;
