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
                head="About Me"
                subhead="llegonetwork is a personal website made by me (Landon) to showcase and explore new concepts to me. As of now I am currently a senior in highschool."
                imgUrl="/favicon.png"
                align="left"
            />
        </>
    );
}