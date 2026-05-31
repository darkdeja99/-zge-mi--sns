import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ModalType = "success" | "error" | "warning" | "info";

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: ModalType;
  buttonText?: string;
  cancelButtonText?: string;
  onClose: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}

export default function CustomModal({
  visible,
  title,
  message,
  type = "info",
  buttonText = "Tamam",
  cancelButtonText = "İptal",
  onClose,
  onCancel,
  children,
}: CustomModalProps) {
  // Modal tipine göre ikon ve renk yapılandırması
  const getIconConfig = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle", color: "#28a745" }; // Yeşil
      case "error":
        return { name: "close-circle", color: "#d9534f" }; // Kırmızı
      case "warning":
        return { name: "warning", color: "#f0ad4e" }; // Sarı
      default:
        return { name: "information-circle", color: "#4DA8DA" }; // Mavi
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons
            name={iconConfig.name as any}
            size={64}
            color={iconConfig.color}
            style={{ marginBottom: 15 }}
          />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          {children}
          <View style={styles.buttonsContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.modalButtonText}>{cancelButtonText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.modalButton,
                type === "error" ? styles.dangerButton : null,
              ]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#162b35",
    borderRadius: 15,
    width: "100%",
    maxWidth: 400,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(77, 168, 218, 0.4)",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#4DA8DA",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dangerButton: {
    backgroundColor: "#d9534f",
  },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
