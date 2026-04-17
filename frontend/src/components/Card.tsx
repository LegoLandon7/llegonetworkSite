import './Card.scss';

export default function Card({
    title,
    description,
    imageUrl,
    linkUrl,
    newTab = false,
}: {
    title: string,
    description?: string,
    imageUrl?: string,
    linkUrl?: string,
    newTab?: boolean,

}) {
    return <a className='card' href={linkUrl} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
        {imageUrl && <img src={imageUrl} alt={title} />}

        <div className='card-content'>
            <h2>{title}</h2>
            <hr />
            {description && <p>{description}</p>}
        </div>
    </a>
}