import SiteHeader from "../components/SiteHeader.tsx";

export default function Settings() {
    return (
        <>
            <SiteHeader 
                head="llegonetwork Settings"
                subhead="settings for account, appearance, and more"
                align="left"
                backLabel="Home"
                backLink="/"
            />

            <button onClick={() => { const t = localStorage.getItem("theme")==="dark"?"light":"dark"; localStorage.setItem("theme", t); document.documentElement.setAttribute("data-theme", t); }}>
                Toggle Theme
            </button>
        </>
    );
}