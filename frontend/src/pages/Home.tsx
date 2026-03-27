import SiteHeader from "../components/SiteHeader.tsx";
import SiteSection from "../components/SiteSection.tsx";

export default function Home() {
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
        </>
    );
}