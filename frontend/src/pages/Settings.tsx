import SiteHeader from "../components/SiteHeader.tsx";

export default function Settings() {
    const toggleTheme = () => {
        const currentTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
        localStorage.setItem("theme", currentTheme);
        document.documentElement.setAttribute("data-theme", currentTheme);
    };

    return (
        <>
            <SiteHeader 
                head="llegonetwork Settings"
                subhead="settings for the website, appearance, and more."
                align="left"
                backLabel="Home"
                backLink="/"
            />

            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <button 
                    onClick={toggleTheme}
                    style={{ 
                        padding: "var(--space-md) var(--space-lg)", 
                        background: "var(--accent)", 
                        color: "var(--text)", 
                        border: "none", 
                        borderRadius: "var(--radius-md)", 
                        cursor: "pointer",
                        fontSize: "var(--text-md)",
                        fontWeight: "var(--weight-medium)",
                        transition: "background var(--transition)"
                    }}
                >
                    Toggle Theme
                </button>
            </div>
        </>
    );
}