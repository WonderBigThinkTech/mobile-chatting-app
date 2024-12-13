import React, { Component } from "react";
import { TextInput, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

class TextInputWithIcon extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
      isIonIcon: true,
    };
  }

  handleFocus = () => {
    this.setState({ isFocused: true });
  };

  handleBlur = () => {
    this.setState({ isFocused: false });
  };

  render() {
    const {
      placeholder,
      icon,
      iconColor,
      iconSize,
      borderColor,
      onFocusBorderColor,
      onChangeText,
      width,
      Family
    } = this.props;
    const { isFocused } = this.state;

    return (
      <View
        style={{
          borderColor: isFocused ? onFocusBorderColor : borderColor,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          maxWidth: width,
          borderRadius: 10,
          marginVertical: 10,
        }}
      >
        <Family
          name={icon}
          size={iconSize}
          color={isFocused ? onFocusBorderColor : iconColor}
          style={
            Family === Ionicons
              ? { marginRight: 10, marginLeft: 5 }
              : { marginHorizontal: 10 }
          }
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={isFocused ? onFocusBorderColor : iconColor}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onChangeText={onChangeText}
          style={{ flex: 1, height: 40 }}
        />
      </View>
    );
  }
}

TextInputWithIcon.defaultProps = {
  icon: "person-circle",
  iconColor: "#ccc",
  borderColor: "#ccc",
  onFocusBorderColor: "#00e5e5",
  width: 150,
  iconSize: 30,
};

export default TextInputWithIcon;
