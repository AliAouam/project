import React from "react";

interface AIPrediction {
  label: string;
  confidence: number;
}

interface Props {
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
  aiPrediction,
  manualLabel,
  setManualLabel,
  stage,
  setStage,
  otherDisease,
  setOtherDisease,
}) => {


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

    </div>
  );
};

export default ClassificationPanel;
