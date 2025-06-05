import torch
import torch.nn as nn

# Même architecture que celle utilisée pour entraîner
class RetinalCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(RetinalCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 56 * 56, 256)
        self.fc2 = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Charger le modèle entraîné
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = RetinalCNN(num_classes=5).to(device)
model.load_state_dict(torch.load('models/retinal_model.pth', map_location=device))
model.eval()

# Liste des classes
class_names = ['Mild', 'Moderate', 'No_DR', 'Proliferate_DR', 'Severe']

# Fonction de prédiction
def predict_image(image_tensor):
    image_tensor = image_tensor.unsqueeze(0).to(device)  # Ajouter batch dimension
    outputs = model(image_tensor)
    _, predicted = torch.max(outputs, 1)
    return class_names[predicted.item()]
