import chain from './chatbot/chain/chain';
import chat from './chatbot/chain/chainWithMongoDB';
import React, { useState, useRef, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import BoldText from './BoldText';
import { ObjectId } from 'mongodb';

import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity
} from 'react-native';

import {BlurView} from '@react-native-community/blur';

interface Message {
  text: string;
  from: string;
}

const Chat = () => {
  const sayGoodbye = ['terimakasih', 'makasih', 'mks', 'terima kasih', 'thx', 'tengkyu'];
  const [messages, setMessages] = useState<Message[]>([{ text: "Selamat datang, saya asisten mental chat yang akan membantu kamu dalam kesehatan mental kamu, silahkan kirimkan keluh kesahmu 😊", from: 'bot' }]);
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  const sessionID = new ObjectId().toString();

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    const updatedMessages = [...messages, { text: newMessage, from: 'me' }];
    setMessages(updatedMessages);
    setNewMessage('');
    setLoading(true);

    try {
      //const result = await chain.invoke({ input: newMessage });
      const result = await chat(newMessage, 'memory', sessionID);
      //console.log(await chain.memory?.loadMemoryVariables({}));
      //const result = await agent(newMessage, 'me');
      const messages = result['response'].split('\n'); 
      const updatedMessagesWithResponse = messages
        .map((message: string) => message.trim())
        .filter((message: string) => message.length > 0)
        .map((message: string) => ({ text: message, from: 'bot' }));
      setMessages([...updatedMessages, ...updatedMessagesWithResponse]);

      if (result['response'] == ''){
        const updatedMessagesWithResponse = [...updatedMessages, { text: "Mohon maaf, inputan kamu mengandung bahasa kasar ataupun SARA", from: 'bot' }];
        setMessages(updatedMessagesWithResponse);
      }
    } catch (error) {
      console.error('Error:', error);
      const updatedMessagesWithResponse = [...updatedMessages, { text:"Maaf ada error, coba kembali lain kali", from: 'bot' }];
      setMessages(updatedMessagesWithResponse);
    } finally {
      setLoading(false);
    }
  };

  const checkGoodbye = (text: String) => {
    const lowercaseText = text.toLowerCase();
    return sayGoodbye.some(word => lowercaseText.includes(word));
  };


  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);




  const [dots, setDots] = useState('.');
  const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots(prevDots => {
          if (prevDots.length === 3) return '.';
          return prevDots + '.';
        });
      }, 500);

      setAnimationInterval(interval);
    }

    return () => {
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [loading]);
  

  return (
    <View style={styles.container}>

    <ImageBackground  style={{width: '100%', height: '100%'}} source={{uri:'https://cdn.kibrispdr.org/data/899/walpeper-line-12.jpg'}}>
  
      <View style={styles.containerContent}>
        <ScrollView style={styles.messagesContainer} ref={scrollViewRef} >
          {messages.map((message, index) => (
            <View
              key={index}
            >
              <View
              style={[
                styles.message,
                message.from === 'me' ? styles.myMessage : styles.otherMessage,
              ]} >
                <BlurView
                blurType="light"
                blurAmount={15}>
                  <BoldText style={styles.messageText}>{message.text}</BoldText>
                </BlurView>
              </View>

              {message.from !== 'me' && checkGoodbye(index > 0 ? messages[index-1].text : '') ? (
                <View
                style={[
                  styles.message,
                  styles.imageMessage,
                ]}>
                  <Image
                    source={require('./assets/love.jpg')}
                    style={{width: 150, height: 150}}
                  />

                </View>
              ) : null}
            </View>
          ))}

          { loading ? (
            <View style={[styles.message, styles.otherMessage]}>
              <BlurView
                blurType="light"
                blurAmount={15}>
                  <Text style={styles.messageText}>Mengetik{dots}</Text>
                </BlurView>
            </View>
          ) : null}

      
      </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={text => setNewMessage(text)}
            editable={true}
            multiline={true}
          />
          <TouchableOpacity
            style={{
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSendMessage}
          >
          <Icon name='send' size={24} color='white' />
        </TouchableOpacity>
        </View>
      </View>
  </ImageBackground>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color:'black',
    backgroundColor: 'white',
  },
  message: {
    maxWidth: '70%',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',

  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',

  },
  imageMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    color: '#FFFFFF',
    padding: 10,
    fontSize: 16,
  },
});

export default Chat;
