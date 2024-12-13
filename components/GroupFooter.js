import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const GroupFooter = ({ onCreateGroup }) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={onCreateGroup} style={styles.createButton}>
        <Text style={styles.createButtonText}>Create New Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 20,justifyContent:"center",
    
    backgroundColor: "white",
    borderBottomColor: "#eeeeeeee",
    borderBottomWidth: 1,
    maxHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    minWidth: "95%",
    borderRadius: 10,
    shadowColor: "#351c75",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 1.84,
    elevation: 5,
    margin: 5,
  },
  createButton: {
    backgroundColor: "#00e5e5",
    padding: 10,
    borderRadius: 5,
  },
  createButtonText: {
    color: "white",
    fontWeight: "700",
  },
});

export default GroupFooter;
