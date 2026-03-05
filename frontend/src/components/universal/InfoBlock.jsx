import './InfoBlock.css'

function InfoBlock({
    header = null, 
    headerPos = 'left', // center, left, right

    buttons=[],

    description = null, 

    img = null, 
    imgPos = 'auto', // auto, left, right, top, bottom

    notes=[],

    maxWidth = null,
    maxHeight = null,
    grow = null,

    divider = true
}) {
    // get the image direction
    const isBottom = imgPos === 'bottom';
    const isRight = imgPos === 'right';
    const isTop = imgPos === 'top';
    const isLeft = imgPos === 'left';

    const flexDir =
        isTop ? 'column' :
        isBottom ? 'column-reverse' :
        isRight ? 'row-reverse' :
        isLeft ? 'row' :
        null; // auto

    // button data
    const buttonsEl = buttons.length > 0 && (
        <div className="info-buttons">
            {buttons.map((btn, idx) => (
                <a key={idx} href={btn.to} className="info-button">{btn.label}</a>
            ))}
        </div>
    );

    // return info block
    return (
       <div className={`info-block ${!flexDir ? imgPos : ''}`} style={{
            ...(flexDir && { flexDirection: flexDir }),
            ...(maxWidth && { maxWidth }),
            ...(maxHeight && { maxHeight }),
            ...(grow && { flex: grow, minWidth: 0 }),
        }}>

            {/*image*/}
            {img && <img src={img} style={{ width: (isTop || isBottom) ? '80%' : '30%' }} />}

            {/*body text*/}
            <div className="info-body">

                {/*header + buttons*/}
                {(header || buttons.length > 0) && (
                    <div className="info-header-row">
                        {headerPos === 'right' && buttonsEl}
                        {header && <h2 style={{ textAlign: headerPos }}>{header}</h2>}
                        {(headerPos === 'left' || headerPos === 'center') && buttonsEl}
                    </div>
                )}

                {/*divider*/}
                {divider && <div className="header-divider" />}

                {/*description*/}
                {description && <p>{description}</p>}

                {/*notes*/}
                {notes.length > 0 && (
                    <div className="info-notes">
                        {notes.map((note, idx) => (
                            <div key={idx} className="info-note">

                                <hr className="note-divider" />

                                <div className="info-note-body">

                                    <strong>{`${note.label}:`}</strong>

                                    {note.link 
                                        ? <a href={note.link} target="_blank" rel="noopener noreferrer">{note.text}</a>
                                        : <span>{note.text}</span>
                                    }
                                    
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
       </div>
    );
}

export default InfoBlock