import MainNavigation from './main-navigation';
import Footer from './footer';

function Layout(props) {
  return (
    <>
      <MainNavigation />
      <main>{props.children}</main>
      <Footer />
    </>
  );
}

export default Layout;
