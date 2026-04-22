import SiteHeader from "../components/SiteHeader";
import Card from "../components/Card";

export default function Bots() {
    return (
        <>
            <SiteHeader 
                head="llegonetwork Bots"
                subhead="A collection of bots created by llegonetwork for many purposes."
                align="left"
                backLabel="Home"
                backLink="/"
            />

            <Card
                title="LegoBot"
                description="A muiltipurpose Discord bot with features like moderation, fun commands, and more. This is a recreation of my old Carla-Bot."
                imageUrl="/favicon.png"
                linkUrl="discord.com"
                newTab
            />

            <Card
                title="LegoGPT"
                description="A discord bot using OpenAI's API to provide fun AI responses to user prompts. Has a 10 message history and can be used for fun conversations or to get help with questions."
                imageUrl="/favicon.png"
                linkUrl="discord.com"
                newTab
            />

            <Card
                title="StatsBot"
                description="A discord bot that provides many helpful statistics such as voice chat interactions, message counts, and more! Also featuring a user leveling system."
                imageUrl="/favicon.png"
                linkUrl="discord.com"
                newTab
            />

            <Card
                title="The Jinxer"
                description="This discord bot can make interactions fun by jinxing users when they say the same thing!"
                imageUrl="/favicon.png"
                linkUrl="discord.com"
                newTab
            />

            <Card
                title="Carla-Bot"
                description="My original discord bot that I created to do almost everything. Features include triggers, timers, moderation commands, and so much more. Currently being replaced by LegoBot. Paradoy of Carl-Bot."
                imageUrl="/favicon.png"
                linkUrl="discord.com"
                newTab
            />
        </>
    );
}