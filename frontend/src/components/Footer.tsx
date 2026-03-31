import './Footer.scss';

export default function Footer() {
    return (
        <footer className="site-footer">
            <p className="footer-left"> &copy; {new Date().getFullYear()} llegonetwork. All rights reserved.</p>

            <div className="footer-right">
                <a href="/terms">Terms of Service</a>
                <a href="/privacy">Privacy Policy</a>
            </div>
        </footer>
    );
}