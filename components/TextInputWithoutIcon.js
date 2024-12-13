import React, { Component } from "react";
import { Text, TextInput } from "react-native";

class TextInputWithoutIcon extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
    };
  }

  handleFocus = () => {
    this.setState({ isFocused: true });
  };

  handleBlur = () => {
    this.setState({ isFocused: false });
  };

  render() {
    const { isFocused } = this.state;
    const {
      placeholder,
      keyboardType,
      onChangeText,
      value,
      corner
    } = this.props;

    return (
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={isFocused ? "#00e5e5" : "#ccc"}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        value={value}
        style={{
          flex: 1,
          height: 40,
          borderColor: isFocused ? "#00e5e5" : "#ccc",
          width: "100%",
          paddingLeft: 10,
          borderWidth: 1,
          borderRadius: 10,
          marginVertical: 10,
          minHeight: 40,
          maxHeight: 40,
          borderBottomColor: "#ccc",
          borderBottomWidth: 1,
          paddingVertical: 8,
          fontSize: 16,
          minWidth: "90%",
          borderTopRightRadius: corner ? 0 : 10,
          borderBottomRightRadius: corner ? 0 : 10,
        }}
      />
    );
  }
}

export default TextInputWithoutIcon;
