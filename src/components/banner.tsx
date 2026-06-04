export function Banner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 py-16 px-8 sm:px-12 md:py-20 md:px-16 shadow-xl mb-8">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 max-w-2xl text-white">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white/20 rounded-full mb-4">
          Novidades Exclusivas
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Explore Nossos Melhores Produtos
        </h1>
        <p className="text-lg sm:text-xl text-indigo-100 font-light leading-relaxed">
          Encontre uma seleção especial de eletrônicos, vestuário, móveis e acessórios de alta performance. Qualidade garantida com atendimento premium.
        </p>
      </div>
    </div>
  );
}
