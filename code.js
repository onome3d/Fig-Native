"use strict";
figma.showUI(__html__, {title: 'FigNative', height: 560, width: 490});

let renderTimeout;
// Call the function generateAndSendReactNativeCode() function when a change is detected
figma.on("documentchange", () => {
    const selection = figma.currentPage.selection[0];
    // Clear the existing timeout if there is one
    if (renderTimeout) {
        clearTimeout(renderTimeout);
    }

    // Set a new timeout to re-render the code after a small delay (e.g., 300ms)
    renderTimeout = setTimeout(() => {
        generateAndSendReactNativeCode(selection);
    }, 300);
});

// Call the function when the plugin is opened
const initialSelection = figma.currentPage.selection[0];
generateAndSendReactNativeCode(initialSelection);

figma.on("selectionchange", () => {
    const selection = figma.currentPage.selection[0];
    generateAndSendReactNativeCode(selection);
});

figma.ui.onmessage = (message) => {
    if (message.type === "generateCode") {
        const selection = figma.currentPage.selection[0];
        generateAndSendReactNativeCode(selection);
    }
};

function getColor(fill) {
    if (!fill || fill.type !== 'SOLID') return 'none';
    const {r, g, b, a} = fill.color;

    const toHex = (value) => {
        const hex = Math.round(value * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    return a !== undefined && a < 1
        ? `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
        : hexColor;
}


function generateReactCode(node, isRoot = false, parentIsAutoLayout = false) {
    const {
        name,
        type,
        width,
        height,
        fills,
        layoutMode,
        strokes,
        strokeWeight,
        bottomLeftRadius,
        bottomRightRadius,
        topLeftRadius,
        topRightRadius,
        fontSize,
        fontWeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom
    } = node;
    const fillColor = getColor(fills && fills[0]);
    const borderColor = getColor(strokes && strokes[0]);

    const hasChildren = node.children && node.children.length > 0;
    let isAutoLayout = parentIsAutoLayout || layoutMode === 'HORIZONTAL' || layoutMode === 'VERTICAL';
    let flexDirection = isAutoLayout ? (layoutMode === 'HORIZONTAL' ? 'row' : 'column') : 'row';


    const flexStyle = isRoot && isAutoLayout ? `display: 'flex', flexDirection: '${flexDirection}',` : '';

    const backgroundColorStyle = fillColor !== 'none' && type !== 'TEXT' && type !== 'IMAGE' ? `backgroundColor: '${fillColor}'` : '';
    const borderStyle = borderColor !== 'none' && strokeWeight ? `borderColor: '${borderColor}', borderWidth: ${strokeWeight}` : '';
    const borderRadiusStyle =
        bottomLeftRadius === bottomRightRadius &&
        bottomRightRadius === topLeftRadius &&
        topLeftRadius === topRightRadius
            ? bottomLeftRadius !== undefined && bottomLeftRadius !== 0 ? `borderRadius: ${bottomLeftRadius}` : ''
            : [
                bottomLeftRadius !== undefined && bottomLeftRadius !== 0 ? `borderBottomLeftRadius: ${bottomLeftRadius}` : '',
                bottomRightRadius !== undefined && bottomRightRadius !== 0 ? `borderBottomRightRadius: ${bottomRightRadius}` : '',
                topLeftRadius !== undefined && topLeftRadius !== 0 ? `borderTopLeftRadius: ${topLeftRadius}` : '',
                topRightRadius !== undefined && topRightRadius !== 0 ? `borderTopRightRadius: ${topRightRadius}` : '',
            ].filter(Boolean).join(', ');


    const fontColorStyle = fillColor !== 'none' && type === 'TEXT' ? `color: '${fillColor}'` : '';
    const fontSizeStyle = fontSize ? `fontSize: ${fontSize}` : '';
    const fontWeightStyle = fontWeight ? `fontWeight: '${fontWeight}'` : '';
    const paddingStyle = isAutoLayout
        ? [
        paddingLeft === paddingRight
            ? paddingLeft !== 0 ? `paddingHorizontal: ${paddingLeft}` : ''
            : [
                paddingLeft !== 0 ? `paddingLeft: ${paddingLeft}` : '',
                paddingRight !== 0 ? `paddingRight: ${paddingRight}` : '',
            ].filter(Boolean).join(', '),
        paddingTop === paddingBottom
            ? paddingTop !== 0 ? `paddingVertical: ${paddingTop}` : ''
            : [
                paddingTop !== 0 ? `paddingTop: ${paddingTop}` : '',
                paddingBottom !== 0 ? `paddingBottom: ${paddingBottom}` : '',
            ].filter(Boolean).join(', '),
    ].filter(Boolean).join(', ') + ','
        : '';

    const formatNumber = (num) => {
        return num.toString().replace(/(\.0+|(\.\d*[1-9])0+)$/, '$2');
    };

    const styleArray = [
        `width: ${formatNumber(parseFloat(width).toFixed(2))}`,
        `height: ${formatNumber(parseFloat(height).toFixed(2))}`,
        backgroundColorStyle,
        borderStyle,
        borderRadiusStyle,
        paddingStyle,
        flexStyle
    ].filter(Boolean).join(', ');

    const style = `style={{ ${styleArray.replace(/,\s*$/, '')} }}`;

    if (name.startsWith("#input#") || name.startsWith("#input-password#")) {
        const isSecure = name.startsWith("#input-password#");
        const value = node.characters || "Type something";
        const styleArrayInputStyle = [
            `width: ${formatNumber(parseFloat(width).toFixed(2))}`,
            `height: ${formatNumber(parseFloat(height).toFixed(2))}`,
            backgroundColorStyle,
            borderStyle,
            borderRadiusStyle
        ].filter(Boolean).join(', ');

        const inputStyle = `style={{ ${styleArrayInputStyle.replace(/,\s*$/, '')} }}`;

        return `<TextInput
            ${inputStyle}
            onChangeText={(text) => console.log(text)}
            value="${value}"
            placeholder="Placeholder"
            ${isSecure ? "secureTextEntry" : ""}
        />\n`;
    }

    if (type === 'TEXT') {

        const styleArrayTextStyle = [
            fontSizeStyle,
            fontWeightStyle,
            fontColorStyle,
            borderStyle,
            borderRadiusStyle
        ].filter(Boolean).join(', ');

        const textStyle = `style={{ ${styleArrayTextStyle.replace(/,\s*$/, '')} }}`;
        return `<Text ${textStyle}>{${node.characters}}</Text>\n`;
    } else {
        const isImage = fills && fills[0] && fills[0].type === 'IMAGE';
        const imageUrl = isImage ? `http://via.placeholder.com/${Math.round(width)}x${Math.round(height)}` : null;

        const styleArrayImageStyle = [
            `width: ${formatNumber(parseFloat(width).toFixed(2))}`,
            `height: ${formatNumber(parseFloat(height).toFixed(2))}`,
            backgroundColorStyle,
            borderStyle,
            borderRadiusStyle,
            paddingStyle,
            flexStyle
        ].filter(Boolean).join(', ');

        const imageStyle = `style={{ ${styleArrayImageStyle.replace(/,\s*$/, '')} }}`;


        const childrenCode = (node.children || []).map(child => generateReactCode(child, false, isAutoLayout)).join('');

        if (name.startsWith("#btn#")) {
            const buttonText = node.children.find(child => child.type === 'TEXT');
            const buttonTextValue = buttonText
                ? `{${buttonText.characters}}`
                : 'Press Here';

            return `<TouchableOpacity ${style} onPress={onPress}>\n<Text>${buttonTextValue}</Text>\n</TouchableOpacity>\n`;
        } else if (isImage) {
            return hasChildren
                ? `<Image ${imageStyle} source={{ uri: '${imageUrl}' }}>${childrenCode}</Image>\n`
                : `<Image ${imageStyle} source={{ uri: '${imageUrl}' }} />\n`;
        } else {
            return hasChildren
                ? `<View ${style}>\n${childrenCode}</View>\n`
                : `<View ${style} />\n`;
        }
    }
}


function generateAndSendReactNativeCode(selection) {
    if (!selection) {
        console.error('Please select a Frame, Rectangle, Group, or Text layer.');
        return;
    }

    const reactNativeCode = generateReactCode(selection, true);
    figma.ui.postMessage({type: 'reactNativeCode', data: reactNativeCode});

}