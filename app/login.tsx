import { router } from "expo-router";
import {
    Image,
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
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {

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

{/* HEADER */}

<View style={styles.header}>

<LinearGradient
colors={["#000000","#000000","#2a0000","#5a0000"]}
start={{x:0.2,y:0}}
end={{x:1,y:1}}
style={styles.gradient}
/>

<Image
source={require("../assets/images/IMG_5141.png")}
style={styles.logo}
/>

<Text style={styles.logoText}>D F F</Text>

<Text style={styles.foundation}>
DOMINANCE FORBES FOUNDATION
</Text>

<Text style={styles.tagline}>Strength in Unity.</Text>
<Text style={styles.tagline}>We Shape Tomorrow.</Text>

</View>

{/* WHITE LOGIN SECTION */}

<View style={styles.card}>

<View style={styles.toggle}>

<View style={styles.toggleActive}>
<Text style={styles.toggleActiveText}>Sign In</Text>
</View>

<TouchableOpacity
style={styles.toggleInactive}
onPress={()=>router.push("/signup")}
>
<Text style={styles.toggleInactiveText}>
Create Account
</Text>
</TouchableOpacity>

</View>

<Text style={styles.label}>EMAIL</Text>

<TextInput
style={styles.input}
placeholder="your@email.com"
keyboardType="email-address"
/>

<Text style={styles.label}>PASSWORD</Text>

<TextInput
style={styles.input}
placeholder="••••••••"
secureTextEntry
/>

<TouchableOpacity>
<Text style={styles.forgot}>Forgot your password?</Text>
</TouchableOpacity>

<View style={styles.twofaBox}>

<View style={styles.twofaRow}>
<FontAwesome name="lock" size={18} color="#d40000"/>
<Text style={styles.twofaTitle}>
2-Step Verification enabled
</Text>
</View>

<Text style={styles.twofaSub}>
Authenticator app · SMS backup
</Text>

</View>

<TouchableOpacity
style={styles.signin}
onPress={()=>router.replace("/")}
>
<Text style={styles.signinText}>Sign In</Text>
</TouchableOpacity>

<View style={styles.dividerRow}>
<View style={styles.line}/>
<Text style={styles.dividerText}>
or continue with
</Text>
<View style={styles.line}/>
</View>

<View style={styles.socialRow}>

<TouchableOpacity style={styles.socialButton}>
<FontAwesome name="google" size={18} color="#4285F4"/>
<Text style={styles.socialText}> Google</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.socialButton}>
<FontAwesome name="facebook" size={18} color="#1877F2"/>
<Text style={styles.socialText}> Facebook</Text>
</TouchableOpacity>

</View>

<Text style={styles.infoText}>
Email & mobile verification required on first sign in
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

header:{
height:320,
justifyContent:"flex-end",
alignItems:"center",
paddingBottom:40
},

gradient:{
position:"absolute",
top:0,
left:0,
right:0,
bottom:0
},

logo:{
width:110,
height:110,
resizeMode:"contain",
marginBottom:15
},

logoText:{
color:"#ffffff",
fontSize:34,
letterSpacing:10,
marginTop:4
},

foundation:{
color:"#8a8a8a",
letterSpacing:4,
fontSize:11,
marginTop:10
},

tagline:{
color:"#d1d1d1",
fontSize:17,
marginTop:6,
fontWeight:"400",
letterSpacing:0.3
},

card:{
flex:1,
backgroundColor:"#fff",
padding:25,
paddingBottom:40,
marginTop:-10
},

toggle:{
flexDirection:"row",
backgroundColor:"#eee",
borderRadius:20,
padding:4,
marginBottom:20
},

toggleActive:{
flex:1,
backgroundColor:"#fff",
borderRadius:16,
padding:12,
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.15,
shadowRadius:6
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

input:{
backgroundColor:"#F2F2F2",
padding:16,
borderRadius:12,
marginTop:6
},

forgot:{
color:"#d40000",
textAlign:"right",
marginTop:8
},

twofaBox:{
borderWidth:1,
borderColor:"#f2b6b6",
backgroundColor:"#fff5f5",
padding:14,
borderRadius:14,
marginTop:15
},

twofaRow:{
flexDirection:"row",
alignItems:"center",
gap:8
},

twofaTitle:{
fontWeight:"600",
marginLeft:6
},

twofaSub:{
color:"#777",
marginTop:4
},

signin:{
backgroundColor:"#d40000",
padding:18,
borderRadius:16,
marginTop:20,
alignItems:"center",
shadowColor:"#ff0000",
shadowOpacity:0.5,
shadowRadius:10,
shadowOffset:{width:0,height:4}
},

signinText:{
color:"#fff",
fontWeight:"bold",
fontSize:18
},

dividerRow:{
flexDirection:"row",
alignItems:"center",
marginTop:20
},

dividerText:{
marginHorizontal:8,
color:"#888"
},

line:{
flex:1,
height:1,
backgroundColor:"#ddd"
},

socialRow:{
flexDirection:"row",
justifyContent:"space-between",
marginTop:16
},

socialButton:{
flexDirection:"row",
backgroundColor:"#f2f2f2",
padding:14,
borderRadius:12,
width:"48%",
justifyContent:"center",
alignItems:"center"
},

socialText:{
fontWeight:"500"
},

infoText:{
marginTop:14,
textAlign:"center",
color:"#888",
fontSize:12
}

});