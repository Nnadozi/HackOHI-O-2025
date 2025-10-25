from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd

data = pd.read_csv("color_names.csv")

r = data['Red (8 bit)']
g = data['Green (8 bit)']
b = data['Blue (8 bit)']

y = data['Name']
X = data[['Red (8 bit)', 'Green (8 bit)', 'Blue (8 bit)']]
X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=0.8)

model = DecisionTreeClassifier()
model.fit(X_train, y_train)

preds = model.predict([255, 255, 255])
print(X_test)
score = accuracy_score(y_test, preds)

print("score: " + str(score))