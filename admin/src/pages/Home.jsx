import AuthPanel from '../components/AuthPanel';

export default function Home({ user }) {
    return (
        <main className="">
            {/* HERO */}
            <section className="bg-[#131312] text-white pt-24 pb-32">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h1 className="text-5xl font-extrabold leading-tight">
                            Active Users
                        </h1>

                        <img src="assets/img/chart-active-users.png" />
                    </div>

                    <div className="relative">
                        <div>
                            <h1 className="text-5xl font-extrabold leading-tight">
                                Live Users
                            </h1>

                            <img src="assets/img/chart-active-users.png" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#131312] text-white pt-24 pb-32">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h1 className="text-5xl font-extrabold leading-tight">
                            Active Users
                        </h1>

                        <img src="assets/img/chart-active-users.png" />
                    </div>

                    <div className="relative">
                        <div>
                            <h1 className="text-5xl font-extrabold leading-tight">
                                Live Users
                            </h1>

                            <img src="assets/img/chart-active-users.png" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
