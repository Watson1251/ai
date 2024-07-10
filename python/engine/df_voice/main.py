import numpy as np
import pandas as pd
import os
import librosa
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import RandomOverSampler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Activation, Dropout
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import EarlyStopping
from tqdm import tqdm


def label_encoder(column):
    le = LabelEncoder().fit(column)
    print(column.name, le.classes_)
    return le.transform(column)


def load_data(audio_files_path):
    folders = os.listdir(audio_files_path)
    data = []
    labels = []

    for folder in folders:
        files = os.listdir(os.path.join(audio_files_path, folder))
        for file in tqdm(files, desc=f"Processing {folder}"):
            file_path = os.path.join(audio_files_path, folder, file)
            audio, sample_rate = librosa.load(file_path, res_type="kaiser_fast")
            mfccs_features = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
            mfccs_features_scaled = np.mean(mfccs_features.T, axis=0)
            data.append(mfccs_features_scaled)
            labels.append(folder)

    feature_df = pd.DataFrame({"features": data, "class": labels})
    feature_df["class"] = label_encoder(feature_df["class"])

    X = np.array(feature_df["features"].tolist())
    y = np.array(feature_df["class"].tolist())

    ros = RandomOverSampler(random_state=42)
    X_resampled, y_resampled = ros.fit_resample(X, y)

    y_resampled = to_categorical(y_resampled)

    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42)

    return X_train, X_test, y_train, y_test, feature_df["class"].unique(), feature_df["features"][0].shape


def build_model(input_shape, num_labels):
    model = Sequential([
        Dense(128, input_shape=input_shape),
        Activation("relu"),
        Dropout(0.5),
        Dense(256),
        Activation("relu"),
        Dropout(0.5),
        Dense(128),
        Activation("relu"),
        Dropout(0.5),
        Dense(num_labels),
        Activation("softmax")
    ])

    model.compile(loss="categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
    return model


def train_model(model, X_train, y_train, X_test, y_test):
    early = EarlyStopping(monitor="val_loss", patience=5)
    history = model.fit(X_train, y_train, validation_data=(X_test, y_test), batch_size=2, epochs=100, callbacks=[early])
    return history


def save_model(model, filename):
    model.save(filename)
    print(f"Model saved as {filename}")


def load_saved_model(filename):
    loaded_model = load_model(filename)
    return loaded_model


def detect_fake(filename, model):
    sound_signal, sample_rate = librosa.load(filename, res_type="kaiser_fast")
    mfcc_features = librosa.feature.mfcc(y=sound_signal, sr=sample_rate, n_mfcc=40)
    mfccs_features_scaled = np.mean(mfcc_features.T, axis=0)
    mfccs_features_scaled = mfccs_features_scaled.reshape(1, -1)
    result_array = model.predict(mfccs_features_scaled)
    result_classes = ["FAKE", "REAL"]
    result = np.argmax(result_array[0])
    print(f"Result for {filename}: {result_classes[result]}")


if __name__ == "__main__":
    audio_files_path = "./KAGGLE/AUDIO/"
    saved_model_filename = 'audio_classifier_model.h5'

    X_train, X_test, y_train, y_test, num_labels, input_shape = load_data(audio_files_path)
    model = build_model(input_shape, len(num_labels))
    history = train_model(model, X_train, y_train, X_test, y_test)
    save_model(model, saved_model_filename)

    loaded_model = load_saved_model(saved_model_filename)

    test_real = "./DEMONSTRATION/DEMONSTRATION/linus-original-DEMO.mp3"
    test_fake = "./DEMONSTRATION/DEMONSTRATION/linus-to-musk-DEMO.mp3"

    detect_fake(test_real, loaded_model)
    detect_fake(test_fake, loaded_model)
