import re

with open("src/app/compare/page.tsx", "r") as f:
    content = f.read()

# Add variants={fadeInUp} to Detailed Breakdown cards
content = content.replace('<motion.div key={i} whileHover={{ y: -4 }}', '<motion.div variants={fadeInUp} key={i} whileHover={{ y: -4 }}')

# Recommendations
content = content.replace('<div key={i} className="bg-[#0a101d] rounded-2xl border border-white/5 p-6 flex items-start gap-4">', '<motion.div variants={fadeInUp} key={i} className="bg-[#0a101d] rounded-2xl border border-white/5 p-6 flex items-start gap-4">')
content = re.sub(r'(<motion\.div variants=\{fadeInUp\} key=\{i\} className="bg-\[#0a101d\] rounded-2xl border border-white/5 p-6 flex items-start gap-4">.*?)(</div>\n                \)\))', r'\1</motion.div>\n                ))', content, flags=re.DOTALL)

# Add variants={fadeInUp} to Quick Comparison Rows
perf_old = """const PerfChartRow = ({ label, basic, advanced, enterprise }: any) => (
  <div className="grid grid-cols-12 gap-4 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">"""

perf_new = """const PerfChartRow = ({ label, basic, advanced, enterprise }: any) => (
  <motion.div variants={fadeInUp} className="grid grid-cols-12 gap-4 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">"""
content = content.replace(perf_old, perf_new)

# Fix closing tag for PerfChartRow
perf_old_end = """      <ProgressBar value={enterprise.pct} colorClass="bg-emerald-400" />
    </div>
  </div>
);"""
perf_new_end = """      <ProgressBar value={enterprise.pct} colorClass="bg-emerald-400" />
    </div>
  </motion.div>
);"""
content = content.replace(perf_old_end, perf_new_end)

# Verification pipeline steps
pipeline_old = """                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1, y: -5 }}"""
pipeline_new = """                  <motion.div 
                    key={i}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.1, y: -5 }}"""
content = content.replace(pipeline_old, pipeline_new)


with open("src/app/compare/page.tsx", "w") as f:
    f.write(content)
