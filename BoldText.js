import React from 'react';
import { Text } from 'react-native';

const BoldText = ({ children, style }) => {
    const regex = /\*\*(.*?)\*\*/; 
    const parts = children.split(regex);

    return (
        <Text style={[style, { fontWeight: 'normal' }]}>
        {parts.map((part, index) => (
            <Text key={index}>{part}</Text>
        ))}
        {parts.map((part, index) => (
            regex.test(part) && (
            <Text key={index + parts.length} style={{ fontWeight: 'bold' }}>
                {part.slice(2, -2)} // Extract bold text and apply bold weight
            </Text>
            )
        ))}
        </Text>
    );
};

export default BoldText;
