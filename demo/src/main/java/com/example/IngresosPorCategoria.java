package com.example;
import java.io.IOException;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class IngresosPorCategoria {

    public static class IngresosMapper extends Mapper<LongWritable, Text, Text, DoubleWritable> {
        private Text categoria = new Text();
        private DoubleWritable ingresos = new DoubleWritable();

        @Override
        public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
            // Saltar encabezado
            if (key.get() == 0 && value.toString().contains("id,storeId")) {
                return;
            }

            String[] campos = value.toString().split(",");
            try {
                // Verificar que tenemos suficientes campos (al menos 15 para category_name)
                if (campos.length < 15) {
                    return;
                }
                
                // Extraer datos según tu estructura
                String nombreCategoria = campos[14].trim(); // category_name
                String ventasTexto = campos[8].trim(); // sold (ej: "1487 sold")
                double precio = Double.parseDouble(campos[9].trim()); // price

                // Extraer número de ventas del texto "1487 sold"
                int ventas = 0;
                if (ventasTexto.contains("sold")) {
                    String numeroVentas = ventasTexto.replace("sold", "").trim();
                    ventas = Integer.parseInt(numeroVentas);
                }

                // Calcular ingreso total
                double ingreso = precio * ventas;

                // Solo procesar si hay ventas
                if (ventas > 0) {
                    categoria.set(nombreCategoria);
                    ingresos.set(ingreso);
                    context.write(categoria, ingresos);
                }
                
            } catch (Exception e) {
                // Ignorar filas mal formadas
                System.err.println("Error procesando línea: " + value.toString());
                e.printStackTrace();
            }
        }
    }

    public static class IngresosReducer extends Reducer<Text, DoubleWritable, Text, DoubleWritable> {
        @Override
        public void reduce(Text key, Iterable<DoubleWritable> values, Context context)
                throws IOException, InterruptedException {

            double suma = 0.0;
            for (DoubleWritable val : values) {
                suma += val.get();
            }
            context.write(key, new DoubleWritable(suma));
        }
    }

    public static void main(String[] args) throws Exception {
        // Validar argumentos
        if (args.length != 2) {
            System.err.println("Uso: IngresosPorCategoria <input path> <output path>");
            System.exit(-1);
        }
        
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "Ingresos Totales por Categoria AliExpress");
        job.setJarByClass(IngresosPorCategoria.class);

        job.setMapperClass(IngresosMapper.class);
        job.setReducerClass(IngresosReducer.class);

        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(DoubleWritable.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));   // dataset.csv
        FileOutputFormat.setOutputPath(job, new Path(args[1])); // carpeta salida

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}