import SiteHeader from "../components/SiteHeader";
import Card from "../components/Card.tsx";

export default function Projects() {
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
                imageUrl="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                linkUrl="https://github.com/legolandon7/ElementClicker"
            />

            <Card 
                title="DDA Raycaster"
                description="A simple example project using the DDA raycasting algorithm to render a 3D scene."
                imageUrl="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                linkUrl="https://github.com/legolandon7/DDARaycasterJS"
                newTab
            />
        </>
    );
}