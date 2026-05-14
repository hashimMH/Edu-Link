// src/theme.js

const colors = {
    primary: "#6200ee",
    secondary: "#03dac6",
    background: "#ffffff",
    text: "#000000",
    error: "#FB4612",
    // Add more colors as needed
  };
  
  const fontSizes = {
    small: 12,
    medium: 16,
    large: 20,
    xLarge: 24,
  };
  
  const fonts = {
    regular: "Roboto-Regular",
    medium: "Roboto-Medium",
    bold: "Roboto-Bold",
    // Add more fonts as needed
  };
  
  const styles = {
    header: {
      fontSize: fontSizes.large,
      color: colors.primary,
      fontFamily: fonts.bold,
    },
    subheader: {
      fontSize: fontSizes.medium,
      color: colors.secondary,
      fontFamily: fonts.medium,
    },
    bodyText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: fonts.regular,
    },
    errorText: {
      fontSize: fontSizes.small,
      color: colors.error,
      fontFamily: fonts.regular,
      textAlign:'start',
    },
    // Add more reusable styles here
  };
  
  export default {
    colors,
    fontSizes,
    fonts,
    styles,
  };
  