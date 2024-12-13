import React, { Component } from "react";
import { ActivityIndicator, Modal } from "react-native";
import { View, Text } from "react-native";

class Loader extends Component {
  render() {
    const { visible } = this.props;
    return (
      <Modal visible={visible} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              height: "auto",
              width: "auto",
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: "#fff",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 5,
            }}
          >
            <ActivityIndicator size={"large"} color={"#00e5e5"} />
            <Text
              style={{
                fontSize: 22,
                color: "#00e5e5",
                fontWeight: "500",
                marginLeft: 20,
              }}
            >
              Loading
            </Text>
          </View>
        </View>
      </Modal>
    );
  }
}

export default Loader;
