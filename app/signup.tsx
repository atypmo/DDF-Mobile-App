import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { FontAwesome } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Signup() {

const [password,setPassword] = useState("")
const [confirmPassword,setConfirmPassword] = useState("")
const [showPassword,setShowPassword] = useState(false)
const [age, setAge] = useState(18)

let strength = 0

if(password.length >= 8) strength++
if(/[A-Z]/.test(password)) strength++
if(/[0-9]/.test(password)) strength++
if(/[!@#$%^&*]/.test(password)) strength++

let strengthColor = "#ff4d4d"
let strengthWidth: `${number}%` = "25%"

if(strength === 2){
strengthColor = "#ff9900"
strengthWidth = "50%"
}

if(strength === 3){
strengthColor = "#ffd633"
strengthWidth = "75%"
}

if(strength === 4){
strengthColor = "#00cc66"
strengthWidth = "100%"
}

return (

<SafeAreaView style={styles.container}>

<KeyboardAvoidingView
style={{flex:1}}
behavior={Platform.OS === "ios" ? "padding" : "height"}
>

<ScrollView
contentContainerStyle={{
flexGrow:1,
backgroundColor:"#fff"
}}
>

<View style={styles.card}>

{/* TOGGLE */}

<View style={styles.toggle}>

<TouchableOpacity
style={styles.toggleInactive}
onPress={()=>router.back()}
>
<Text style={styles.toggleInactiveText}>
Sign In
</Text>
</TouchableOpacity>

<View style={styles.toggleActive}>
<Text style={styles.toggleActiveText}>
Create Account
</Text>
</View>

</View>

{/* NAME */}

<Text style={styles.label}>FULL NAME</Text>

<TextInput
style={styles.input}
placeholder="John Doe"
/>

{/* EMAIL */}

<Text style={styles.label}>EMAIL</Text>

<TextInput
style={styles.input}
placeholder="your@email.com"
/>

<View style={styles.ageHeaderRow}>
<Text style={styles.label}>AGE</Text>
<Text style={styles.ageValue}>{age}</Text>
</View>

<Slider
style={styles.ageSlider}
minimumValue={13}
maximumValue={100}
step={1}
value={age}
minimumTrackTintColor="#d40000"
maximumTrackTintColor="#d9d9d9"
thumbTintColor="#d40000"
onValueChange={setAge}
/>

{/* PASSWORD */}

<Text style={styles.label}>PASSWORD</Text>

<View style={styles.passwordRow}>

<TextInput
style={styles.passwordInput}
placeholder="••••••••"
secureTextEntry={!showPassword}
value={password}
onChangeText={setPassword}
/>

<TouchableOpacity onPress={()=>setShowPassword(!showPassword)}>
<FontAwesome
name={showPassword ? "eye-slash" : "eye"}
size={18}
color="#666"
/>
</TouchableOpacity>

</View>

{/* STRENGTH BAR */}

<View style={styles.strengthBarContainer}>
<View
style={[
styles.strengthBar,
{backgroundColor:strengthColor,width:strengthWidth}
]}
/>
</View>

{/* PASSWORD REQUIREMENTS */}

<View style={styles.requirements}>

<Text style={password.length >= 8 ? styles.valid : styles.invalid}>
• At least 8 characters
</Text>

<Text style={/[A-Z]/.test(password) ? styles.valid : styles.invalid}>
• One uppercase letter
</Text>

<Text style={/[0-9]/.test(password) ? styles.valid : styles.invalid}>
• One number
</Text>

<Text style={/[!@#$%^&*]/.test(password) ? styles.valid : styles.invalid}>
• One special character
</Text>

</View>

{/* CONFIRM PASSWORD */}

<Text style={styles.label}>CONFIRM PASSWORD</Text>

<TextInput
style={styles.input}
placeholder="••••••••"
secureTextEntry
value={confirmPassword}
onChangeText={setConfirmPassword}
/>

{confirmPassword.length > 0 && password !== confirmPassword && (
<Text style={styles.error}>
Passwords do not match
</Text>
)}

{/* CREATE BUTTON */}

<TouchableOpacity style={styles.signupButton}>
<Text style={styles.signupText}>
Create Account
</Text>
</TouchableOpacity>

<Text style={styles.infoText}>
By creating an account you agree to the
Terms and Privacy Policy
</Text>

</View>

</ScrollView>

</KeyboardAvoidingView>

</SafeAreaView>

);
}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#000"
},

card:{
flex:1,
backgroundColor:"#fff",
padding:25,
paddingTop:40
},

toggle:{
flexDirection:"row",
backgroundColor:"#eee",
borderRadius:20,
padding:4,
marginBottom:30
},

toggleActive:{
flex:1,
backgroundColor:"#fff",
borderRadius:16,
padding:12,
alignItems:"center"
},

toggleInactive:{
flex:1,
padding:12,
alignItems:"center"
},

toggleActiveText:{
fontWeight:"600"
},

toggleInactiveText:{
color:"#777"
},

label:{
color:"#888",
fontSize:12,
marginTop:10
},

ageHeaderRow:{
marginTop:10,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

ageValue:{
color:"#d40000",
fontSize:14,
fontWeight:"700"
},

ageSlider:{
width:"100%",
height:36,
marginTop:2
},

input:{
backgroundColor:"#F2F2F2",
padding:16,
borderRadius:12,
marginTop:6
},

passwordRow:{
flexDirection:"row",
alignItems:"center",
backgroundColor:"#F2F2F2",
borderRadius:12,
paddingHorizontal:16,
marginTop:6
},

passwordInput:{
flex:1,
paddingVertical:16
},

strengthBarContainer:{
height:6,
backgroundColor:"#eee",
borderRadius:6,
marginTop:10,
overflow:"hidden"
},

strengthBar:{
height:6,
borderRadius:6
},

requirements:{
marginTop:10
},

valid:{
color:"#00aa55",
fontSize:12,
marginTop:3
},

invalid:{
color:"#999",
fontSize:12,
marginTop:3
},

error:{
color:"#ff4d4d",
fontSize:12,
marginTop:6
},

signupButton:{
backgroundColor:"#d40000",
padding:18,
borderRadius:16,
marginTop:25,
alignItems:"center"
},

signupText:{
color:"#fff",
fontWeight:"bold",
fontSize:18
},

infoText:{
marginTop:18,
textAlign:"center",
color:"#888",
fontSize:12
}

});
