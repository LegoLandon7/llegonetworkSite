import InfoBlock from '../components/universal/InfoBlock.jsx'

import HeaderIcon from '/favicon.png'

import '../components/css/containers.css'

function About() {
  return <div className="main-content">
        <div className="flex-container-wrap">
            <InfoBlock 
                header={"About me"}
                description={"My name is Landon Lego. I am currently a High School Senior who very much enjoys coding. I take many classes that do with computer science, and programming. Although, I like to venture off a bit! This website is part of me expanding and trying new things.\n\nIn this website you will find many discord bots, programs, and other things that I have created in just my free time alone."}
                grow={2}
                buttons={[
                    {label: "Projects", to: "/projects"},
                    {label: "Contact", to: "/contact"}
                ]}
            />
            <InfoBlock
                img={"https://cdn.discordapp.com/avatars/623964733799923733/d15a88574598af1f9acfc128f8bb0aeb.png?size=4096"}
                imgPos={"top"}
                notes={[
                    {label: "nickname", text: "TheLegoGuy"},
                    {label: "github", text: "LegoLandon7", link: "https://github.com/LegoLandon7"},
                    {label: "discord", text: "legomaster_01", link: "https://discord.com/users/623964733799923733"},
                    {label: "reddit", text: "u/legomaster_01", link: "https://reddit.com/u/legomaster_01"},
                    {label: "instagram", text: "lego.guy0", link: "https://instagram.com/lego.guy0"},
                    {label: "youtube", text: "legomaster_01", link: "https://youtube.com/@legomaster_01"},
                    {label: "tiktok", text: "legomaster_00", link: "https://tiktok.com/@legomaster_00"},
                    {label: "tiktok", text: "thelegoguy0", link: "https://tiktok.com/@thelegoguy0"},
                ]}
                divider={false}
                grow={1}
            />
        </div>
    </div>
}

export default About