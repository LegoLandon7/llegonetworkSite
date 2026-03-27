import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader.tsx";
import SiteSection from "../components/SiteSection.tsx";

export default function Home() {
    const [user, setUser] = useState<{userId:string,username:string,avatar:string|null}|null>(null);
    const [guilds, setGuilds] = useState<{id:string,name:string}[]|null>(null);
    
    useEffect(() => { fetch("https://api.llegonetwork.dev/user", { credentials: "include" }).then(r => r.ok ? r.json() : null).then(d => { if (d) { setUser(d); fetch("https://api.llegonetwork.dev/user/guilds", { credentials: "include" }).then(r => r.json()).then(setGuilds); } }); }, []);
    return (
        <>
            <SiteHeader 
                head="Welcome to llegonetwork.dev"
                subhead="stuff about llegonetwork, and links to projects and socials"
                align="center"
            />

            <SiteSection
                head="About Us"
                subhead="llegonetwork is a website made by a single creator that is currently a senior in highschool. This website includes many discord bots, projects, games, and much more! This website is mainly used by me (Landon) to expirement with web development, and other new concepts to me!"
                imgUrl="/favicon.png"
                align="left"
            />

            <div style={{padding:"1rem"}}>
                {!user ? <button onClick={() => window.location.href = "https://api.llegonetwork.dev/auth/login"}>Login with Discord</button> : <div><img src={`https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png`} width={64} style={{borderRadius:"50%"}}/><p><b>{user.username}</b> ({user.userId})</p><button onClick={() => window.location.href = "https://api.llegonetwork.dev/auth/logout"}>Logout</button>{guilds && <details><summary>Guilds ({guilds.length})</summary><ul>{guilds.map(g => <li key={g.id}>{g.name}</li>)}</ul></details>}</div>}
            </div>
        </>
    );
}