import SiteHeader from "../components/SiteHeader";
import Card from "../components/Card.tsx";

export default function Projects() {
    const githubIcon = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";

    return (
        <>
            <SiteHeader 
                head="llegonetwork Projects"
                subhead="A collection of projects created by Landon for fun and learning."
                align="left"
                backLabel="Home"
                backLink="/"
            />

            <Card 
                title="Element Clicker"
                description="A simple clicker game where you click to gain atomic points and buy upgrades."
                imageUrl={githubIcon}
                linkUrl="https://github.com/legolandon7/ElementClicker"
                newTab
            />

            <Card 
                title="DDA Raycaster"
                description="A simple example project using the DDA raycasting algorithm to render a 3D scene."
                imageUrl={githubIcon}
                linkUrl="https://github.com/legolandon7/DDARaycasterJS"
                newTab
            />
        </>
    );
}