import re

with open("src/app/compare/page.tsx", "r") as f:
    content = f.read()

# Add variants
variants = """
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

export default function ComparePage() {
"""

content = content.replace("export default function ComparePage() {", variants)

# Header
header_old = """<header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16 border-b border-white/10 pb-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Compare Verification APIs</h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Choose the right verification pipeline for your application's security, speed and identity requirements.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 lg:justify-end">"""
header_new = """<motion.header variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16 border-b border-white/10 pb-8">
            <motion.div variants={fadeInUp} className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Compare Verification APIs</h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Choose the right verification pipeline for your application's security, speed and identity requirements.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 lg:justify-end">"""
content = content.replace(header_old, header_new)
content = content.replace("</header>", "</motion.header>")

# Replace standard sections
old_section = 'initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}'
new_section = 'variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}'
content = content.replace(old_section, new_section)

old_cta = 'initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}'
content = content.replace(old_cta, new_section)

# API Cards
content = content.replace('<section className="grid lg:grid-cols-3 gap-6 mb-24">', '<motion.section variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid lg:grid-cols-3 gap-6 mb-24">')
content = content.replace('</section>', '</motion.section>', 1) # First occurrence of </section> is the API cards, but wait, I fixed them all to </motion.section> earlier!
content = content.replace('<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} whileHover={{ y: -4 }}', '<motion.div variants={fadeInUp} whileHover={{ y: -4 }}')
content = content.replace('<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} whileHover={{ y: -4 }}', '<motion.div variants={fadeInUp} whileHover={{ y: -4 }}')
content = content.replace('<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} whileHover={{ y: -4, scale: 1.02 }}', '<motion.div variants={fadeInUp} whileHover={{ y: -4, scale: 1.02 }}')


with open("src/app/compare/page.tsx", "w") as f:
    f.write(content)
